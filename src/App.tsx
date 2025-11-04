import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

import { useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { useThemeStore } from './store/themeStore';
import { Toaster } from './components/ui/toaster';
import { useFavicon } from './hooks/useFavicon';
import { ServicePage } from './components/services/ServicePage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthPage from './pages/Auth';
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
import AIProductFillerHome from './pages/ai-product-filler/Home';
import AIProductFillerGeneration from './pages/ai-product-filler/Generation';
import Settings from './pages/ai-product-filler/Settings';
import AIProductFillerTemplates from './pages/ai-product-filler/Templates';
import AIProductFillerTranslator from './pages/ai-product-filler/Translator';
import AIProductFillerAnalysis from './pages/ai-product-filler/Analysis';
import AIProductFillerCharacteristics from './pages/ai-product-filler/Characteristics';
import AIProductFillerPhotoEditor from './pages/ai-product-filler/PhotoEditor';
import AIProductFillerWatermarkRemoval from './pages/ai-product-filler/WatermarkRemoval_NEW';
import PriceBuilderHome from './pages/ai-price-builder/Home';
import PriceBuilderGenerate from './pages/ai-price-builder/Generate';
import BusinessAgentDashboard from './pages/ai-business-agent/Dashboard';
import BusinessAgentChat from './pages/ai-business-agent/Chat';
import BusinessAgentReports from './pages/ai-business-agent/Reports';

// AI Photo Editor Pages
import AIPhotoEditorHome from './pages/ai-photo-editor/Home';
import AIPhotoEditorUpload from './pages/ai-photo-editor/Upload';
import AIPhotoEditorGallery from './pages/ai-photo-editor/Gallery';
import AIPhotoEditorResize from './pages/ai-photo-editor/Resize';
import AIPhotoEditorRemoveBackground from './pages/ai-photo-editor/RemoveBackground';
import AIPhotoEditorEnhance from './pages/ai-photo-editor/Enhance';
import AIPhotoEditorUpscale from './pages/ai-photo-editor/Upscale';
import AIPhotoEditorAltText from './pages/ai-photo-editor/AltText';
import AIPhotoEditorOptimize from './pages/ai-photo-editor/Optimize';
import AIPhotoEditorReposition from './pages/ai-photo-editor/Reposition';
import AIPhotoEditorWatermarkRemoval from './pages/ai-photo-editor/WatermarkRemoval';
import AIPhotoEditorRename from './pages/ai-photo-editor/Rename';
import AIPhotoEditorConvert from './pages/ai-photo-editor/Convert';
import AIPhotoEditorAIBackground from './pages/ai-photo-editor/AIBackground';
import AIPhotoEditorAIText from './pages/ai-photo-editor/AIText';

// Profile Pages
import ProfileDashboard from './pages/profile/ProfileDashboard';
import ServicesPage from './pages/profile/ServicesPage';
import ProfileSettings from './pages/profile/ProfileSettings';
import CompanyPulsePage from './pages/profile/CompanyPulsePage';
import SubscriptionsPage from './pages/profile/SubscriptionsPage';

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

// SEO Writer Pages
import SeoWriterDashboard from './pages/seo-writer/Dashboard';
import SeoWriterTopicGeneration from './pages/seo-writer/TopicGeneration';
import SeoWriterContentCalendar from './pages/seo-writer/ContentCalendar';
import SeoWriterArticleManagement from './pages/seo-writer/ArticleManagement';
import SeoWriterAnalytics from './pages/seo-writer/Analytics';
import SeoWriterSettings from './pages/seo-writer/Settings';
import SeoWriterArticleEditor from './pages/seo-writer/ArticleEditor';
import SeoWriterArticleViewEdit from './pages/seo-writer/ArticleViewEdit';
import SeoWriterLayout from './components/SeoWriterLayout';

// Photo-AI-SEO Pages
import PhotoAiSeoTable from './pages/photo-ai-seo/PhotoAiSeoTable';
import PhotoAiSeoLayout from './components/layout/PhotoAiSeoLayout';

// Компонент для favicon логіки всередині Router контексту
function FaviconHandler() {
  useFavicon();
  return null;
}

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
      <FaviconHandler />
      <Toaster />
      <Routes>
        {/* Direct public route to ensure /ai-photo-editor matches */}
         <Route element={<MainLayout />}>
          {/* Public Auth Route */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Redirect legacy product-filler auth routes to unified /auth */}
          <Route path="/ai-product-filler/login" element={<Navigate to="/auth" replace />} />
          <Route path="/ai-product-filler/register" element={<Navigate to="/auth" replace />} />

          {/* AI Photo Editor - public routes */}
          <Route path="/ai-photo-editor" element={<Outlet />}>
            <Route index element={<AIPhotoEditorHome />} />
            <Route path="upload" element={<AIPhotoEditorUpload />} />
            <Route path="gallery" element={<AIPhotoEditorGallery />} />
            <Route path="resize" element={<AIPhotoEditorResize />} />
            <Route path="upscale" element={<AIPhotoEditorUpscale />} />
            <Route path="optimize" element={<AIPhotoEditorOptimize />} />
            <Route path="remove-background" element={<AIPhotoEditorRemoveBackground />} />
            <Route path="reposition" element={<AIPhotoEditorReposition />} />
            <Route path="watermark-removal" element={<AIPhotoEditorWatermarkRemoval />} />
            <Route path="alt-text" element={<AIPhotoEditorAltText />} />
            <Route path="rename" element={<AIPhotoEditorRename />} />
            <Route path="convert" element={<AIPhotoEditorConvert />} />
            <Route path="ai-background" element={<AIPhotoEditorAIBackground />} />
            <Route path="ai-text" element={<AIPhotoEditorAIText />} />
            <Route path="enhance" element={<AIPhotoEditorEnhance />} />
          </Route>

          {/* Protected application routes */}
          <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
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
          {/* AI Content - SEO Writer */}
          <Route path="/ai-content" element={<SeoWriterLayout><SeoWriterDashboard /></SeoWriterLayout>} />
          <Route path="/ai-content/generation/post" element={<SeoWriterLayout><SeoWriterTopicGeneration /></SeoWriterLayout>} />
          {/* SEO Writer - Content Management */}
          <Route path="/seo-writer" element={<SeoWriterLayout><SeoWriterDashboard /></SeoWriterLayout>} />
          <Route path="/seo-writer/topics" element={<SeoWriterLayout><SeoWriterTopicGeneration /></SeoWriterLayout>} />
          <Route path="/seo-writer/calendar" element={<SeoWriterLayout><SeoWriterContentCalendar /></SeoWriterLayout>} />
          <Route path="/seo-writer/articles" element={<SeoWriterLayout><SeoWriterArticleManagement /></SeoWriterLayout>} />
          <Route path="/seo-writer/article/:id" element={<SeoWriterLayout><SeoWriterArticleViewEdit /></SeoWriterLayout>} />
          <Route path="/seo-writer/articles/new" element={<SeoWriterLayout><SeoWriterArticleEditor /></SeoWriterLayout>} />
          <Route path="/seo-writer/analytics" element={<SeoWriterLayout><SeoWriterAnalytics /></SeoWriterLayout>} />
          <Route path="/seo-writer/settings" element={<SeoWriterLayout><SeoWriterSettings /></SeoWriterLayout>} />
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

          {/* AI Product Filler */}
          <Route path="/ai-product-filler" element={<AIProductFillerHome />} />
          <Route path="/ai-product-filler/generation" element={<AIProductFillerGeneration />} />
          <Route path="/ai-product-filler/templates" element={<AIProductFillerTemplates />} />
          <Route path="/ai-product-filler/translator" element={<AIProductFillerTranslator />} />
          <Route path="/ai-product-filler/analysis" element={<AIProductFillerAnalysis />} />
          <Route path="/ai-product-filler/characteristics" element={<AIProductFillerCharacteristics />} />
          <Route path="/ai-product-filler/photo-editor" element={<AIProductFillerPhotoEditor />} />
          <Route path="/ai-product-filler/watermark-removal" element={<AIProductFillerWatermarkRemoval />} />
          <Route path="/ai-product-filler/settings" element={<Settings/>} />

          {/* AI Price Builder */}
          <Route path="/ai-price-builder" element={<PriceBuilderHome />} />
          <Route path="/ai-price-builder/generate" element={<PriceBuilderGenerate />} />

          {/* AI Business Agent */}
          <Route path="/ai-business-agent" element={<BusinessAgentDashboard />} />
          <Route path="/ai-business-agent/chat" element={<BusinessAgentChat />} />
          <Route path="/ai-business-agent/reports" element={<BusinessAgentReports />} />

          {/* AI Supply Manager */}
          <Route path="/ai-supply" element={<ServicePage />} />
          <Route path="/ai-supply/shelf-analysis" element={<ShelfAnalysisPage />} />
          <Route path="/ai-supply/product-list" element={<ProductListPage />} />
          <Route path="/ai-supply/supplier-analysis" element={<SupplierAnalysisPage />} />
          <Route path="/ai-supply/orders" element={<OrdersPage />} />
          <Route path="/ai-supply/send-orders" element={<SendOrdersPage />} />

          {/* AI Photo Editor - moved to public routes above */}

          {/* Photo-AI-SEO */}
          <Route path="/photo-ai-seo" element={<PhotoAiSeoLayout />}>
            <Route index element={<PhotoAiSeoTable />} />
            <Route path="settings" element={<div className="p-6"><h1 className="text-2xl font-bold text-cyan-700">Settings</h1><p className="text-cyan-600">Coming soon...</p></div>} />
          </Route>

          {/* Profile System */}
          <Route path="/profile" element={<ProfileDashboard />} />
          <Route path="/profile/services" element={<ServicesPage />} />
          <Route path="/profile/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/profile/subscriptions/active" element={<SubscriptionsPage />} />
          <Route path="/profile/subscriptions/billing" element={<SubscriptionsPage />} />
          <Route path="/profile/subscriptions/plans" element={<SubscriptionsPage />} />
          <Route path="/profile/pulse" element={<CompanyPulsePage />} />
          <Route path="/profile/settings" element={<ProfileSettings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
