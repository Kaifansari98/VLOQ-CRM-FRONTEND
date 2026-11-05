export interface AddressDetails {
  address: string;
  state: string;
  city: string;
  pincode: string;
}

export const INDIAN_STATES: string[] = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

export function parseAddress(str?: string | null): AddressDetails {
  if (!str) return { address: "", state: "", city: "", pincode: "" };
  try {
    const parsed = JSON.parse(str);
    if (typeof parsed === "object" && parsed !== null) {
      return {
        address: typeof parsed.address === "string" ? parsed.address : "",
        state: typeof parsed.state === "string" ? parsed.state : "",
        city: typeof parsed.city === "string" ? parsed.city : "",
        pincode: typeof parsed.pincode === "string" ? parsed.pincode : "",
      };
    }
  } catch {
    // Legacy plain-text address
  }
  return { address: str, state: "", city: "", pincode: "" };
}

export function formatAddress(fields: AddressDetails): string {
  const address = (fields.address || "").trim();
  const state = (fields.state || "").trim();
  const city = (fields.city || "").trim();
  const pincode = (fields.pincode || "").trim();

  if (!address && !state && !city && !pincode) return "";

  return JSON.stringify({ address, state, city, pincode });
}

export function formatAddressDisplay(str?: string | null): string {
  if (!str) return "—";
  const parsed = parseAddress(str);
  if (!parsed.state && !parsed.city && !parsed.pincode) {
    return parsed.address || "—";
  }
  const parts = [
    parsed.address,
    parsed.city,
    parsed.state,
    parsed.pincode ? `PIN: ${parsed.pincode}` : "",
  ].filter(Boolean);
  return parts.join(", ") || "—";
}

