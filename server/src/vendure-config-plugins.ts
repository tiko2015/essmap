import {
  DefaultJobQueuePlugin,
  DefaultSchedulerPlugin,
  DefaultSearchPlugin,
  VendureConfig,
} from '@vendure/core';
import { RequestContext, ProductVariant, StockDisplayStrategy } from '@vendure/core';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { GraphiqlPlugin } from '@vendure/graphiql-plugin';
import { OrganizationsPlugin } from './plugins/organizations/organizations.plugin';
import { DashboardPlugin } from '@vendure/dashboard/plugin';

import 'dotenv/config';
import path from 'path';

const IS_DEV = process.env.APP_ENV === 'dev';

export class ExactStockDisplayStrategy implements StockDisplayStrategy {
  getStockLevel(
    ctx: RequestContext,
    productVariant: ProductVariant,
    saleableStockLevel: number
  ): string {
    return saleableStockLevel.toString();
  }
}

export const plugins: VendureConfig['plugins'] = [
  GraphiqlPlugin.init(),
  AssetServerPlugin.init({
    route: 'assets',
    assetUploadDir: path.join(__dirname, '../static/assets'),
    presets: [
      { name: 'tiny', width: 64, height: 64, mode: 'resize' },
      { name: 'thumb', width: 96, height: 96, mode: 'resize' },
      { name: 'small', width: 350, height: 350, mode: 'crop' },
      { name: 'medium', width: 600, height: 600, mode: 'resize' },
      { name: 'large', width: 800, height: 800, mode: 'resize' },
    ],
    assetUrlPrefix: IS_DEV ? undefined : process.env.ASSET_URL_PREFIX || 'https://www.my-shop.com/assets/',
  }),
  DefaultSchedulerPlugin.init(),
  DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
  DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),
  OrganizationsPlugin,
  DashboardPlugin.init({
    route: 'dashboard',
    appDir: IS_DEV
      ? path.join(__dirname, '../dist/dashboard')
      : path.join(__dirname, 'dashboard'),
  }),
];
