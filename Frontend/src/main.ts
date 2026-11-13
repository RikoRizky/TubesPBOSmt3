/**
 * Titik masuk aplikasi MeowPlace.
 *
 * 1. Pilih implementasi service: Mock (data contoh) atau API (backend C#).
 *    Keduanya mengikuti interface yang sama -> POLYMORPHISM.
 * 2. Pilih halaman berdasarkan <body data-page="...">.
 * 3. Jalankan.
 */
import { App, type AppServices } from './app/App';
import { config } from './config';
import type { Page } from './pages/Page';
import { HelpPage } from './pages/HelpPage';
import { HomePage } from './pages/HomePage';
import { ApiNewsletterService } from './services/api/ApiNewsletterService';
import { ApiOrderService } from './services/api/ApiOrderService';
import { ApiProductRepository } from './services/api/ApiProductRepository';
import { HttpClient } from './services/api/HttpClient';
import { MockNewsletterService } from './services/mock/MockNewsletterService';
import { MockOrderService } from './services/mock/MockOrderService';
import { MockProductRepository } from './services/mock/MockProductRepository';
import { StorageFactory } from './services/storage/StorageFactory';

function createServices(): AppServices {
  const storage = StorageFactory.create();

  if (config.useApi) {
    const http = new HttpClient(config.apiBaseUrl);
    return {
      products: new ApiProductRepository(http),
      orders: new ApiOrderService(http),
      newsletter: new ApiNewsletterService(http),
      storage,
    };
  }

  return {
    products: new MockProductRepository(),
    orders: new MockOrderService(),
    newsletter: new MockNewsletterService(),
    storage,
  };
}

function createPage(app: App): Page {
  switch (document.body.dataset.page) {
    case 'bantuan':
      return new HelpPage(app);
    default:
      return new HomePage(app);
  }
}

const app = new App(createServices());
app.start(createPage(app));
