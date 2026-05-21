import { forwardRef, useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import type { OrderWithItems, InvoiceSettings } from '@/types';
import { Separator } from '@/components/ui/separator';
import { getInvoiceSettings } from '@/db/api';

interface InvoiceProps {
  order: OrderWithItems;
}

export const Invoice = forwardRef<HTMLDivElement, InvoiceProps>(({ order }, ref) => {
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getInvoiceSettings();
        setSettings(data);
      } catch (error) {
        console.error('Failed to load invoice settings:', error);
      }
    };
    loadSettings();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600';
      case 'confirmed':
        return 'text-blue-600';
      case 'on_the_way':
        return 'text-purple-600';
      case 'delivered':
        return 'text-green-600';
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const companyName = settings?.company_name || 'Shottopoth';
  const showLogo = settings?.show_logo && settings?.company_logo;
  const showQR = settings?.show_qr_code && settings?.qr_code_content;

  return (
    <div ref={ref} data-print="invoice" className="bg-white text-black p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header with Logo and QR Code */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        {/* Left: Logo */}
        <div className="flex-shrink-0 w-full md:w-auto flex justify-center md:justify-start">
          {showLogo && settings.company_logo ? (
            <img 
              src={settings.company_logo} 
              alt={companyName}
              className="h-16 md:h-20 object-contain"
            />
          ) : (
            <h1 className="text-2xl md:text-3xl font-bold text-primary">{companyName}</h1>
          )}
        </div>

        {/* Center: Company Info */}
        <div className="text-center flex-1 order-3 md:order-2">
          {settings?.company_address && (
            <p className="text-xs md:text-sm text-gray-600">{settings.company_address}</p>
          )}
          {(settings?.company_phone || settings?.company_email) && (
            <div className="text-xs md:text-sm text-gray-600 mt-1">
              {settings.company_phone && <span>{settings.company_phone}</span>}
              {settings.company_phone && settings.company_email && <span className="mx-2">|</span>}
              {settings.company_email && <span>{settings.company_email}</span>}
            </div>
          )}
          {settings?.show_tax_id && settings?.tax_id && (
            <p className="text-xs md:text-sm text-gray-600 mt-1">Tax ID: {settings.tax_id}</p>
          )}
        </div>

        {/* Right: QR Code */}
        <div className="flex-shrink-0 w-full md:w-auto flex justify-center md:justify-end order-2 md:order-3">
          {showQR && settings.qr_code_content ? (
            <div className="bg-white p-2 rounded border border-gray-300">
              <QRCode 
                value={settings.qr_code_content} 
                size={80}
                className="md:w-20 md:h-20"
              />
            </div>
          ) : null}
        </div>
      </div>

      <Separator className="my-4 md:my-6 bg-gray-300" />

      {/* Invoice Title and Order Info */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold mb-2">INVOICE</h2>
        <p className="text-xs md:text-sm text-gray-600">
          Order ID: <span className="font-semibold text-black break-all">{order.id}</span>
        </p>
        <p className="text-xs md:text-sm text-gray-600">
          Date: <span className="font-semibold text-black">{formatDate(order.created_at)}</span>
        </p>
      </div>

      {/* Customer Information */}
      <div className="mb-6 md:mb-8">
        <h3 className="text-base md:text-lg font-bold mb-3 border-b border-gray-300 pb-2">Customer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div>
            <p className="text-xs md:text-sm text-gray-600">Name</p>
            <p className="font-semibold text-sm md:text-base">{order.delivery_address.name}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-600">Phone</p>
            <p className="font-semibold text-sm md:text-base">{order.delivery_address.phone}</p>
          </div>
          <div className="col-span-1 md:col-span-2">
            <p className="text-xs md:text-sm text-gray-600">Delivery Address</p>
            <p className="font-semibold text-sm md:text-base">{order.delivery_address.address}</p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-6 md:mb-8">
        <h3 className="text-base md:text-lg font-bold mb-3 border-b border-gray-300 pb-2">Order Items</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-2 text-xs md:text-sm font-semibold text-gray-700">Product</th>
                <th className="text-center py-2 text-xs md:text-sm font-semibold text-gray-700">Qty</th>
                <th className="text-right py-2 text-xs md:text-sm font-semibold text-gray-700">Price</th>
                <th className="text-right py-2 text-xs md:text-sm font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-3 text-xs md:text-sm">
                    <div>
                      <div>{item.product_name}</div>
                      {(item.selected_color || item.selected_size) && (
                        <div className="text-xs text-gray-500 mt-1 space-x-2">
                          {item.selected_color && <span>Color: {item.selected_color}</span>}
                          {item.selected_size && <span>Size: {item.selected_size}</span>}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-xs md:text-sm text-center">{item.quantity}</td>
                  <td className="py-3 text-xs md:text-sm text-right">৳{item.product_price.toFixed(2)}</td>
                  <td className="py-3 text-xs md:text-sm text-right font-semibold">
                    ৳{(item.product_price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Notes */}
      {settings?.custom_notes && (
        <div className="mb-6 md:mb-8">
          <div className="bg-gray-50 p-3 md:p-4 rounded border border-gray-200">
            <p className="text-xs md:text-sm font-semibold text-gray-700 mb-2">Notes:</p>
            <p className="text-xs md:text-sm text-gray-600 whitespace-pre-wrap">{settings.custom_notes}</p>
          </div>
        </div>
      )}

      {/* Payment Summary */}
      <div className="mb-6 md:mb-8">
        <div className="ml-auto max-w-full md:max-w-sm">
          <div className="space-y-2">
            <div className="flex justify-between text-xs md:text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">৳{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs md:text-sm">
              <span className="text-gray-600">Delivery Charge</span>
              <span className="font-semibold">৳{order.delivery_charge.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-xs md:text-sm text-green-600">
                <span>Discount {order.voucher_code && `(${order.voucher_code})`}</span>
                <span className="font-semibold">-৳{order.discount.toFixed(2)}</span>
              </div>
            )}
            <Separator className="my-2 bg-gray-300" />
            <div className="flex justify-between text-base md:text-lg font-bold">
              <span>Total</span>
              <span>৳{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="mb-6 md:mb-8">
        <h3 className="text-base md:text-lg font-bold mb-3 border-b border-gray-300 pb-2">Payment Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div>
            <p className="text-xs md:text-sm text-gray-600">Payment Method</p>
            <p className="font-semibold text-sm md:text-base capitalize">{order.payment_method.replace(/_/g, ' ')}</p>
          </div>
          {order.payment_amount && (
            <div>
              <p className="text-xs md:text-sm text-gray-600">Payment Type</p>
              <p className="font-semibold text-sm md:text-base capitalize">{order.payment_amount.replace(/_/g, ' ')}</p>
            </div>
          )}
          {order.transaction_id && (
            <div className="col-span-1 md:col-span-2">
              <p className="text-xs md:text-sm text-gray-600">Transaction ID</p>
              <p className="font-semibold text-sm md:text-base break-all">{order.transaction_id}</p>
            </div>
          )}
        </div>
      </div>

      {/* Bank Details */}
      {settings?.show_bank_details && settings?.bank_name && (
        <div className="mb-6 md:mb-8">
          <h3 className="text-base md:text-lg font-bold mb-3 border-b border-gray-300 pb-2">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Bank Name</p>
              <p className="font-semibold text-sm md:text-base">{settings.bank_name}</p>
            </div>
            {settings.bank_account_name && (
              <div>
                <p className="text-xs md:text-sm text-gray-600">Account Name</p>
                <p className="font-semibold text-sm md:text-base">{settings.bank_account_name}</p>
              </div>
            )}
            {settings.bank_account_number && (
              <div>
                <p className="text-xs md:text-sm text-gray-600">Account Number</p>
                <p className="font-semibold text-sm md:text-base">{settings.bank_account_number}</p>
              </div>
            )}
            {settings.bank_routing_number && (
              <div>
                <p className="text-xs md:text-sm text-gray-600">Routing Number</p>
                <p className="font-semibold text-sm md:text-base">{settings.bank_routing_number}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Terms and Conditions */}
      {settings?.terms_and_conditions && (
        <div className="mb-6 md:mb-8">
          <h3 className="text-base md:text-lg font-bold mb-3 border-b border-gray-300 pb-2">Terms and Conditions</h3>
          <p className="text-xs text-gray-600 whitespace-pre-wrap">{settings.terms_and_conditions}</p>
        </div>
      )}

      {/* Footer */}
      <Separator className="my-4 md:my-6 bg-gray-300" />
      <div className="text-center text-xs md:text-sm text-gray-600">
        <p className="mb-1">{settings?.footer_text || 'Thank you for shopping with us!'}</p>
        <p>For any queries, please contact our customer support.</p>
      </div>
    </div>
  );
});

Invoice.displayName = 'Invoice';
