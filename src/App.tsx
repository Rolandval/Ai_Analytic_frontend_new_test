import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { useThemeStore } from './store/themeStore';
import { Toaster } from './components/ui/toaster';
import { ServicePage } from './components/services/ServicePage';
import { Dashboard } from './pages/Dashboard';
import BatteriesDirectory from './pages/batteries/Directory';
import BatteriesLostDirectory from './pages/batteries/LostDirectory';
import SolarPanelsDirectory from './pages/solar-panels/Directory';
import InvertersDirectory from './pages/inverters/Directory';
import { BatteriesPriceHistory } from './pages/batteries/PriceHistory';
import { SolarPanelsPriceHistory } from './pages/solar-panels/PriceHistory';
import { InvertersPriceHistory } from './pages/inverters/PriceHistory';
import { AIChat } from './pages/ai-chat/Chat';
import BatteryCurrentPricesPage from './pages/prices/batteries/CurrentPrices';
import BatteryPriceComparisonPage from './pages/prices/batteries/PriceComparison';
import SolarPanelCurrentPricesPage from './pages/prices/solar-panels/CurrentPrices';
import SolarPanelPriceComparisonPage from './pages/prices/solar-panels/PriceComparison';
import InverterCurrentPricesPage from './pages/prices/inverters/CurrentPrices';
import InverterPriceComparisonPage from './pages/prices/inverters/PriceComparison';
import InverterAnalyticsPage from './pages/inverters/Analytics';
import SolarPanelAnalyticsPage from './pages/solar-panels/Analytics';
import QRCodeGenerator from './pages/ai-character/qr-code/Generate';

// Google Tables Pages
import BatteryGoogleTablesPage from './pages/batteries/GoogleTables';
import SolarGoogleTablesPage from './pages/solar-panels/GoogleTables';
import SolarPanelsLostDirectory from './pages/solar-panels/LostDirectory';
import InverterGoogleTablesPage from './pages/inverters/GoogleTables';
import InvertersLostDirectory from './pages/inverters/LostDirectory';

// Solar Panels Pages
import SolarPanelSuppliersPage from './pages/solar-panels/Suppliers';
import SolarPanelTasksPage from './pages/solar-panels/Tasks';

// Inverters Pages

import InverterSuppliersPage from './pages/inverters/Suppliers';
import InverterTasksPage from './pages/inverters/Tasks';

// Batteries Pages
import BatteryAnalyticsPage from './pages/batteries/Analytics';

import BatterySuppliersPage from './pages/batteries/Suppliers';
import BatteryTasksPage from './pages/batteries/Tasks';
import InvoiceRecognition from './pages/ai-accountant/documents/invoices/InvoiceRecognition';
import FacebookPost from './pages/AdsManager/Facebook/FacebookPost';
import GoogleAd from './pages/AdsManager/Google/GoogleAd';
import UploadReports from './pages/reports/Upload';
import PostGeneration from './pages/ContentGeneration/PostGeneration';
import { AIExtensionsPage } from './pages/AIExtensionsPage';
import { AIModelsPage } from './pages/AIModelsPage';
// Forecasting Pages
import CSVDatasetPage from './pages/ai-forecast/csv-dataset';
import SQLQueriesPage from './pages/ai-forecast/sql-queries';
import AnalyticsPage from './pages/ai-forecast/analytics';

// AI Supply Manager Pages
import ShelfAnalysisPage from './pages/ai-supply/shelf-analysis';
import ProductListPage from './pages/ai-supply/product-list';
import SupplierAnalysisPage from './pages/ai-supply/supplier-analysis';
import OrdersPage from './pages/ai-supply/orders';
import SendOrdersPage from './pages/ai-supply/send-orders';

function App() {
  const { theme, accentColor } = useThemeStore();

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.style.setProperty('--primary', accentColor);
  }, [accentColor]);

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Toaster />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />

          {/* Prices */}
          <Route path="/prices/batteries" element={<BatteryCurrentPricesPage />} />
          <Route path="/prices/batteries/comparison" element={<BatteryPriceComparisonPage />} />
          <Route path="/prices/solar-panels" element={<SolarPanelCurrentPricesPage />} />
          <Route path="/prices/solar-panels/comparison" element={<SolarPanelPriceComparisonPage />} />
          <Route path="/prices/inverters" element={<InverterCurrentPricesPage />} />
          <Route path="/prices/inverters/comparison" element={<InverterPriceComparisonPage />} />

          {/* Batteries */}
          <Route path="/batteries/directory" element={<BatteriesDirectory />} />
          <Route path="/batteries/directory/lost" element={<BatteriesLostDirectory />} />
          <Route path="/batteries/google-tables" element={<BatteryGoogleTablesPage />} />
          <Route path="/batteries/price-history" element={<BatteriesPriceHistory />} />
          <Route path="/batteries/analytics" element={<BatteryAnalyticsPage />} />

          <Route path="/batteries/suppliers" element={<BatterySuppliersPage />} />
          <Route path="/batteries/tasks" element={<BatteryTasksPage />} />

          {/* Solar Panels */}
          <Route path="/solar-panels/directory" element={<SolarPanelsDirectory />} />
          <Route path="/solar-panels/directory/lost" element={<SolarPanelsLostDirectory />} />
          <Route path="/solar-panels/google-tables" element={<SolarGoogleTablesPage />} />
          <Route path="/solar-panels/price-history" element={<SolarPanelsPriceHistory />} />
          <Route path="/solar-panels/analytics" element={<SolarPanelAnalyticsPage />} />

          <Route path="/solar-panels/suppliers" element={<SolarPanelSuppliersPage />} />
          <Route path="/solar-panels/tasks" element={<SolarPanelTasksPage />} />

          {/* Inverters */}
          <Route path="/inverters/directory" element={<InvertersDirectory />} />
          <Route path="/inverters/directory/lost" element={<InvertersLostDirectory />} />
          <Route path="/inverters/google-tables" element={<InverterGoogleTablesPage />} />
          <Route path="/inverters/price-history" element={<InvertersPriceHistory />} />
          <Route path="/inverters/analytics" element={<InverterAnalyticsPage />} />

          <Route path="/inverters/suppliers" element={<InverterSuppliersPage />} />
          <Route path="/inverters/tasks" element={<InverterTasksPage />} />

          {/* AI Chat */}
          <Route path="/ai-chat" element={<AIChat />} />
          <Route path="/ai-chat/extensions" element={<AIExtensionsPage />} />
          <Route path="/ai-chat/models" element={<AIModelsPage />} />

          {/* Reports */}
          <Route path="/reports/upload" element={<UploadReports />} />

          {/* AI Services */}
          <Route path="/ai-forecast" element={<ServicePage />} />
          <Route path="/ai-forecast/csv-dataset" element={<CSVDatasetPage />} />
          <Route path="/ai-forecast/sql-queries" element={<SQLQueriesPage />} />
          <Route path="/ai-forecast/analytics" element={<AnalyticsPage />} />
          <Route path="/ai-procurement" element={<ServicePage />} />
          <Route path="/ai-content" element={<ServicePage />} />
          <Route path="/ai-content/generation/post" element={<PostGeneration />} />
          {/* Ці маршрути будуть імплементовані пізніше */}
          <Route path="ai-content/social/twitter" element={<ServicePage />} />
          <Route path="ai-content/seo/tags" element={<ServicePage />} />

          <Route path="ai-accountant" element={<ServicePage />} />
          <Route path="ai-accountant/document-recognition/invoice" element={<InvoiceRecognition />} />
          <Route path="ai-accountant/documents/invoices" element={<InvoiceRecognition />} />
          
          <Route path="ai-ads" element={<ServicePage />} />
          <Route path="ai-ads/social/facebook" element={<FacebookPost />} />
          <Route path="ai-ads/social/google" element={<GoogleAd />} />
          <Route path="/ai-email" element={<ServicePage />} />
          <Route path="/ai-character" element={<ServicePage />} />
          <Route path="/ai-character/qr-code/generate" element={<QRCodeGenerator />} />
          <Route path="/ai-sales" element={<ServicePage />} />
          <Route path="/ai-video" element={<ServicePage />} />

          {/* AI Supply Manager */}
          <Route path="/ai-supply" element={<ServicePage />} />
          <Route path="/ai-supply/shelf-analysis" element={<ShelfAnalysisPage />} />
          <Route path="/ai-supply/product-list" element={<ProductListPage />} />
          <Route path="/ai-supply/supplier-analysis" element={<SupplierAnalysisPage />} />
          <Route path="/ai-supply/orders" element={<OrdersPage />} />
          <Route path="/ai-supply/send-orders" element={<SendOrdersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
