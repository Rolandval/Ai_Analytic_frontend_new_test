import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ReportUploadForm } from '@/components/reports/ReportUploadForm';

const UploadReports = () => {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Завантаження звітів</h1>
      <Tabs defaultValue="batteries" className="w-full">
        <TabsList>
          <TabsTrigger value="batteries">Акумулятори</TabsTrigger>
          <TabsTrigger value="inverters">Інвертори</TabsTrigger>
          <TabsTrigger value="solar-panels">Сонячні панелі</TabsTrigger>
        </TabsList>
        <TabsContent value="batteries">
          <ReportUploadForm productType="batteries" />
        </TabsContent>
        <TabsContent value="inverters">
          <ReportUploadForm productType="inverters" />
        </TabsContent>
        <TabsContent value="solar-panels">
          <ReportUploadForm productType="solar-panels" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UploadReports;
