import {
  commodityService,
  GRANADILLA_UNAVAILABLE,
  normalizePerKg,
  type CommodityPrice,
  type RawCommodityForecast,
  type CommodityPriceProvider,
  HttpCommodityPriceProvider,
  CommodityService,
} from "./commodity-service";

export type { CommodityPrice, RawCommodityForecast as CommodityForecast, CommodityPriceProvider };
export { GRANADILLA_UNAVAILABLE, normalizePerKg, HttpCommodityPriceProvider, CommodityService };

export async function fetchCommodityPrices(): Promise<CommodityPrice[]> {
  return commodityService.getAllCommodityPrices();
}

export async function fetchSingleCommodity(crop: CommodityPrice["crop"]): Promise<CommodityPrice> {
  return commodityService.getCommodityPrice(crop);
}
