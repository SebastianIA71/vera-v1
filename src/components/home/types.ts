export type Task = {
  id: number; title: string; detail?: string | null;
  propertyId?: string | null; prioFinal?: number | null;
  lastActionAt?: Date | null; tags?: string | null;
};
export type WeightLog = {
  id: number; date: string; value: number;
  snmAgua?: boolean | null; snmCaminar?: boolean | null;
  snmEntreno?: boolean | null; snmEscucha?: boolean | null; snmDisfruta?: boolean | null;
};
export type InboxItem = {
  id: number; content: string; source?: string | null;
  suggestedPropertyId?: string | null; createdAt?: Date | null;
};
export type PropTask = {
  prop: { id: string; name: string; color: string | null; icon: string | null };
  task: { id: number; title: string; prioFinal: number | null };
};
export type ProjTask = {
  proj: { id: number; name: string; color: string | null; icon: string | null };
  task: { id: number; title: string; prioFinal: number | null };
};
export type Trip = {
  id: number; title: string; daysTo: number; startDate: string;
  endDate?: string; who: string; transport?: string;
};
export type EventItem = {
  id: number; title: string; daysTo: number; startDate: string; who: string;
};
