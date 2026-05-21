import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Database, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

interface TableInfo {
  table_name: string;
  row_count?: number;
}

export default function AdminDatabaseManager() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const rowsPerPage = 50;

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableData();
    }
  }, [selectedTable, currentPage]);

  const fetchTables = async () => {
    try {
      setLoading(true);
      
      // Get list of tables from information_schema
      const { data, error } = await supabase.rpc('get_table_names');
      
      if (error) {
        // Fallback: use known tables
        const knownTables = [
          'profiles',
          'products',
          'orders',
          'order_items',
          'reviews',
          'categories',
          'vouchers',
          'delivery_addresses',
          'delivery_locations',
          'payment_gateways',
          'banners',
          'announcements',
          'terms_and_conditions',
          'user_manuals',
          'notifications',
          'order_messages',
          'quick_replies',
          'app_settings'
        ];
        
        setTables(knownTables.map(name => ({ table_name: name })));
      } else {
        setTables(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch tables:', error);
      toast.error('Failed to load database tables');
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async () => {
    if (!selectedTable) return;

    try {
      setLoading(true);
      
      // Get total count
      const { count } = await supabase
        .from(selectedTable)
        .select('*', { count: 'exact', head: true });
      
      setTotalCount(count || 0);

      // Fetch data with pagination
      const from = (currentPage - 1) * rowsPerPage;
      const to = from + rowsPerPage - 1;

      const { data, error } = await supabase
        .from(selectedTable)
        .select('*')
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setColumns(Object.keys(data[0]));
        setTableData(data);
      } else {
        setColumns([]);
        setTableData([]);
      }
    } catch (error) {
      console.error('Failed to fetch table data:', error);
      toast.error('Failed to load table data');
      setTableData([]);
      setColumns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setCurrentPage(1);
    setSearchQuery('');
  };

  const handleRefresh = () => {
    if (selectedTable) {
      fetchTableData();
      toast.success('Data refreshed');
    }
  };

  const totalPages = Math.ceil(totalCount / rowsPerPage);

  const filteredData = tableData.filter((row) => {
    if (!searchQuery) return true;
    return Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    return String(value);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Database className="h-7 w-7 md:h-8 md:w-8" />
              Database Manager
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              View and manage database tables
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Tables List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Tables</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] md:h-[600px]">
                <div className="space-y-2">
                  {loading && tables.length === 0 ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))
                  ) : (
                    tables.map((table) => (
                      <Button
                        key={table.table_name}
                        variant={selectedTable === table.table_name ? 'default' : 'outline'}
                        className="w-full justify-start text-left"
                        onClick={() => handleTableSelect(table.table_name)}
                      >
                        <span className="truncate">{table.table_name}</span>
                      </Button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Table Data */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 w-full sm:w-auto">
                  <CardTitle className="text-base md:text-lg mb-2">
                    {selectedTable ? selectedTable : 'Select a table'}
                  </CardTitle>
                  {selectedTable && (
                    <Badge variant="secondary" className="text-xs">
                      {totalCount} rows
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-full sm:w-[200px]"
                      disabled={!selectedTable}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={!selectedTable || loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedTable ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Database className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No table selected</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Select a table from the list to view its data
                  </p>
                </div>
              ) : loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-lg font-medium">No data found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    This table is empty or no results match your search
                  </p>
                </div>
              ) : (
                <>
                  <ScrollArea className="h-[500px] w-full">
                    <div className="min-w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {columns.map((column) => (
                              <TableHead key={column} className="whitespace-nowrap">
                                {column}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredData.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                              {columns.map((column) => (
                                <TableCell key={column} className="max-w-xs truncate">
                                  {formatValue(row[column])}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1 || loading}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages || loading}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
