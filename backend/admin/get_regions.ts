import { api } from "encore.dev/api";
import db from "../db";

export interface Region {
  id: number;
  name: string;
  coordinates: any; // GeoJSON polygon
  createdAt: Date;
}

export interface GetRegionsResponse {
  regions: Region[];
}

// Gets all regions
export const getRegions = api<void, GetRegionsResponse>(
  { expose: true, method: "GET", path: "/regions" },
  async () => {
    const regions = await db.queryAll`
      SELECT 
        id, 
        name, 
        ST_AsGeoJSON(coordinates) as coordinates,
        created_at
      FROM regions
      ORDER BY name
    `;

    return {
      regions: regions.map(region => ({
        id: region.id,
        name: region.name,
        coordinates: region.coordinates ? JSON.parse(region.coordinates) : null,
        createdAt: region.created_at,
      })),
    };
  }
);
