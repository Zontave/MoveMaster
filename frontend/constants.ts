
import { PackageType, LocationStatus } from './types';

export const APP_NAME = "MoveMaestro";

export const PACKAGE_TYPES: PackageType[] = [
  PackageType.BOX,
  PackageType.TRUNK,
  PackageType.BAG,
  PackageType.BULK,
];

export const LOCATION_STATUSES: LocationStatus[] = [
  LocationStatus.DEPARTURE,
  LocationStatus.TRANSIT,
  LocationStatus.DESTINATION,
];

export const MOCK_USER_EMAIL = "user@example.com";
export const MOCK_USER_ID = "mock-user-123";

// Gemini Model
export const GEMINI_TEXT_MODEL = "gemini-2.5-flash-preview-04-17";
// export const GEMINI_IMAGE_MODEL = "imagen-3.0-generate-002"; // If image generation was needed

export const QR_CODE_PREFIX = "movemaestro://package/";
