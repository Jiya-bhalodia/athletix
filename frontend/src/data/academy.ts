// Mock content for the public site. Replace with API data in later phases.
export const academy = {
  name: "Athletix",
  tagline: "Train with purpose. Grow as a team.",
};

export const navLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Sports", to: "/sports" },
  { label: "Coaching", to: "/coaching" },
  { label: "Achievements", to: "/achievements" },
  { label: "Contact", to: "/contact" },
] as const;

export type Sport = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  details: string;
};

export const sports: Sport[] = [
  {
    id: "football",
    name: "Football",
    emoji: "⚽",
    description: "Ball control, positional play and match fitness.",
    details:
      "Sessions cover passing drills, small-sided games, tactical shape and conditioning for all age groups.",
  },
  {
    id: "cricket",
    name: "Cricket",
    emoji: "🏏",
    description: "Batting, bowling and fielding fundamentals.",
    details: "Net practice, bowling technique, fielding drills and match-simulation sessions.",
  },
  {
    id: "basketball",
    name: "Basketball",
    emoji: "🏀",
    description: "Footwork, shooting and team defence.",
    details: "Dribbling, shooting form, offensive sets and defensive rotations in a team setting.",
  },
  {
    id: "badminton",
    name: "Badminton",
    emoji: "🏸",
    description: "Agility, racket skills and court movement.",
    details: "Grip, strokes, footwork patterns and singles/doubles strategy.",
  },
  {
    id: "tennis",
    name: "Tennis",
    emoji: "🎾",
    description: "Strokes, serve technique and match play.",
    details: "Forehand, backhand and serve technique with point-play and consistency drills.",
  },
  {
    id: "athletics",
    name: "Athletics",
    emoji: "🏃",
    description: "Sprints, distance running and field events.",
    details: "Running mechanics, starts, endurance building and introductory field events.",
  },
];

export const pillars = [
  {
    title: "Skill development",
    text: "Clear technical goals for every level, from beginner to competitive.",
  },
  { title: "Teamwork", text: "Players learn to communicate, support and win together." },
  { title: "Discipline", text: "Regular routines that build consistency on and off the field." },
  { title: "Sportsmanship", text: "Respect for teammates, opponents, officials and the game." },
];

export const pathway = [
  { step: "01", title: "Foundation", text: "Basic movement, coordination and love for the sport." },
  { step: "02", title: "Development", text: "Structured technique and tactical understanding." },
  { step: "03", title: "Performance", text: "Competitive preparation and match exposure." },
];

export const coaching = [
  {
    title: "Coaching",
    text: "Sessions led by qualified coaches with small group sizes. (Sample content — coach details to be added.)",
  },
  {
    title: "Practice facilities",
    text: "Outdoor fields and indoor courts for year-round training. (Sample — facility list to be confirmed.)",
  },
  {
    title: "Training batches",
    text: "Morning and evening batches grouped by age and skill level.",
  },
  { title: "Player development", text: "Regular feedback and progress reviews for every player." },
];

export const achievements = [
  { title: "Inter-school Football Cup", type: "Team trophy", year: "Sample", sport: "Football" },
  {
    title: "District Athletics Meet — 3 medals",
    type: "Medals",
    year: "Sample",
    sport: "Athletics",
  },
  { title: "U-14 Badminton Runners-up", type: "Team result", year: "Sample", sport: "Badminton" },
  {
    title: "First player selected for state camp",
    type: "Milestone",
    year: "Sample",
    sport: "Cricket",
  },
];

export const events = [
  {
    name: "Summer Football Camp",
    sport: "Football",
    date: "Date TBA",
    text: "A week of skill sessions and friendly matches for juniors.",
  },
  {
    name: "Open Trials — Cricket",
    sport: "Cricket",
    date: "Date TBA",
    text: "Assessment day for players interested in joining the cricket batch.",
  },
  {
    name: "Academy Sports Day",
    sport: "Multi-sport",
    date: "Date TBA",
    text: "A day of games and races for players and families.",
  },
];

export const contact = {
  address: "Star Complex, Mumbai",
  phone: "(9898373721)",
  email: "athletix@gmail.com",
  hours: "Daily, 5:00 AM–9:00 PM",
  socials: [
    { label: "Instagram", href: "#" },
    { label: "Facebook", href: "#" },
    { label: "YouTube", href: "#" },
  ],
};
