export type Airport = "JFK" | "LGA" | "EWR";
export type GenderPref = "NONE" | "WOMEN_ONLY" | "MEN_ONLY";

/** Serializable ride row for the dashboard (from server / API). */
export type RideListItem = {
  id: string;
  airport: Airport;
  terminal: string;
  terminalInput: string;
  departureDate: string;
  departureTime24: string;
  departureTime: string;
  totalSpots: number;
  filledSpots: number;
  genderPref: GenderPref;
  timeAway: string;
  isYours?: boolean;
  pendingRequests?: number;
};

export type RideGroup = {
  date: string;
  rides: RideListItem[];
};
