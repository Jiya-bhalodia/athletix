// Shared entity types. Mirror these as Mongoose schemas when the Express/MongoDB backend is added.
export type Entity = { id: string };

export type Sport = Entity & { name: string; category: "Team" | "Individual"; description: string };
export type Coach = Entity & {
  name: string;
  email: string;
  phone: string;
  sportId: string;
  experience: number;
  schedule: string;
  status: "Active" | "On leave";
};
export type Team = Entity & { name: string; sportId: string; coachId: string; ageGroup: string };
export type Player = Entity & {
  userId?: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  sportId: string;
  teamId: string;
  joinDate: string;
  emergencyName: string;
  emergencyPhone: string;
  status: "Active" | "Inactive";
};
export type Session = Entity & {
  title: string;
  teamId: string;
  coachId: string;
  date: string;
  time: string;
  venue: string;
};
export type Attendance = Entity & {
  sessionId: string;
  playerId: string;
  status: "Present" | "Absent";
};
export type Match = Entity & {
  teamId: string;
  opponent: string;
  date: string;
  venue: string;
  tournament: string;
  ourScore: number | null;
  theirScore: number | null;
  status: "Upcoming" | "Completed";
};
export type Performance = Entity & {
  playerId: string;
  teamId?: string;
  matchId?: string;
  rating: number;
  notes: string;
  createdAt?: string;
};
export type Achievement = Entity & {
  title: string;
  type: "Trophy" | "Medal" | "Award" | "Milestone";
  recipientType: "player" | "team";
  playerId?: string;
  teamId?: string;
  recipient?: string;
  sportId: string;
  date: string;
  description: string;
  featured: "Yes" | "No";
};
export type FeePlan = Entity & {
  name: string;
  sportId: string;
  amount: number;
  frequency: "Monthly" | "Quarterly" | "Annual";
};
export type Fee = Entity & {
  playerId: string;
  planId: string;
  amount: number;
  dueDate: string;
  status: "Paid" | "Pending" | "Overdue";
  paidDate?: string;
  method?: string;
  paidAmount?: number;
  pendingAmount?: number;
};
export type Payment = Entity & {
  feeRecordId: string;
  playerId: string;
  amount: number;
  currency: string;
  paidAt: string;
  method: string;
  status: "Succeeded" | "Pending" | "Failed" | "Refunded";
};
export type Announcement = Entity & {
  title: string;
  kind: "Announcement" | "Event" | "Match update" | "Training notice";
  date: string;
  body: string;
  published: "Yes" | "No";
};
export type Activity = Entity & { text: string; at: string };
/** Parent/guardian account linked to one or more players by stable player ids. */
export type Parent = Entity & {
  userId?: string;
  name: string;
  email: string;
  phone: string;
  childIds: string[];
};
