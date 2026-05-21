import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GiftCardEmailRequest {
  recipientName: string;
  recipientEmail: string;
  productName: string;
  giftCode: string;
  giftValue: string;
  customMessage?: string | null;
  templateId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated and is admin
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestData: GiftCardEmailRequest = await req.json();

    // Validate required fields
    if (!requestData.recipientName || !requestData.recipientEmail || 
        !requestData.productName || !requestData.giftCode || !requestData.giftValue || !requestData.templateId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get template
    const { data: template, error: templateError } = await supabaseClient
      .from('gift_card_templates')
      .select('*')
      .eq('id', requestData.templateId)
      .single();

    if (templateError) {
      console.error('Template query error:', templateError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch template', details: templateError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!template) {
      console.error('Template not found for ID:', requestData.templateId);
      return new Response(
        JSON.stringify({ error: 'Template not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get app settings for branding
    const { data: settings } = await supabaseClient
      .from('app_settings')
      .select('site_name, primary_color, logo_url')
      .single();

    const siteName = settings?.site_name || 'Shottopath';

    // Replace placeholders in template
    const subjectLine = template.subject_line.replace('{siteName}', siteName);
    const headerText = template.header_text.replace('{siteName}', siteName);
    const greetingMessage = template.greeting_message
      .replace('{recipientName}', requestData.recipientName)
      .replace('{siteName}', siteName);

    // Get today's date
    const todayDate = new Date();
    const dateText = `<p style="margin: 16px 0; color: #666; font-size: 14px;">
      <strong>Date Issued:</strong> ${todayDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}
    </p>`;

    // Custom message if provided
    let customMessageHtml = '';
    if (requestData.customMessage) {
      customMessageHtml = `
        <div style="background-color: #f9fafb; border-left: 4px solid ${template.primary_color}; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">
            ${requestData.customMessage.replace(/\n/g, '<br>')}
          </p>
        </div>
      `;
    }

    // Create HTML email
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Gift Card from ${siteName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${template.primary_color} 0%, ${template.secondary_color} 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                ${template.emoji} ${headerText}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Dear ${requestData.recipientName},
              </p>
              
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                ${greetingMessage}
              </p>

              ${customMessageHtml}
              
              <!-- Gift Card Details Box -->
              <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border: 2px solid ${template.primary_color}; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">
                  Gift Card Details
                </h2>
                
                <p style="margin: 12px 0; color: #374151; font-size: 14px;">
                  <strong>Product:</strong> ${requestData.productName}
                </p>
                
                <p style="margin: 12px 0; color: #374151; font-size: 14px;">
                  <strong>Value:</strong> ${requestData.giftValue}
                </p>
                
                <div style="background-color: #ffffff; border: 2px dashed ${template.primary_color}; border-radius: 6px; padding: 16px; margin: 16px 0; text-align: center;">
                  <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                    Your Gift Code
                  </p>
                  <p style="margin: 0; color: ${template.primary_color}; font-size: 24px; font-weight: bold; letter-spacing: 2px; font-family: 'Courier New', monospace;">
                    ${requestData.giftCode}
                  </p>
                </div>
                
                ${dateText}
              </div>
              
              <!-- How to Redeem -->
              <div style="margin: 32px 0;">
                <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 16px; font-weight: 600;">
                  How to Redeem:
                </h3>
                <ol style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
                  <li>Visit our website at ${siteName}</li>
                  <li>Browse and add items to your cart</li>
                  <li>Enter your gift code at checkout</li>
                  <li>Enjoy your purchase!</li>
                </ol>
              </div>
              
              <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you have any questions or need assistance, please don't hesitate to contact our support team.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                Thank you for choosing ${siteName}
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This is an automated email. Please do not reply to this message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send email using Resend
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${siteName} <noreply@miaoda.com>`,
        to: [requestData.recipientEmail],
        subject: subjectLine,
        html: htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', errorText);
      console.error('Resend API status:', emailResponse.status);
      
      let errorMessage = 'Failed to send email';
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        errorMessage = errorText;
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorText,
          status: emailResponse.status,
          hint: emailResponse.status === 403 ? 'Check if your Resend API key is valid and has permission to send emails' : 
                emailResponse.status === 422 ? 'Check if the sender email domain is verified in Resend. You may need to verify noreply@miaoda.com or use a different sender email.' :
                'Check Resend dashboard for more details'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const emailData = await emailResponse.json();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Gift card email sent successfully',
        emailId: emailData.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-gift-card-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
