export type Topic = {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  opener: string;
};

export const topics: Topic[] = [
  {
    id: "interview",
    emoji: "💼",
    title: "Job interview",
    desc: "Practice common interview questions",
    opener:
      "Great — let's run a mock interview. To start, tell me a little about yourself and your background.",
  },
  {
    id: "restaurant",
    emoji: "🍽️",
    title: "At a restaurant",
    desc: "Roleplay ordering a meal",
    opener:
      "Welcome in! I'm your server today 😊 Can I start you off with something to drink while you look at the menu?",
  },
  {
    id: "smalltalk",
    emoji: "☕",
    title: "Casual small talk",
    desc: "Warm up with everyday chat",
    opener: "Hey, good to see you! How's your day going so far?",
  },
  {
    id: "standup",
    emoji: "🧑‍💻",
    title: "Daily standup",
    desc: "Give a quick work update",
    opener:
      "Morning! Let's do a quick standup. What did you work on yesterday, and what's the plan for today?",
  },
  {
    id: "travel",
    emoji: "✈️",
    title: "Travel & directions",
    desc: "Ask for help getting around",
    opener:
      "Hi there! You look like you might be looking for something — can I help you find your way?",
  },
  {
    id: "free",
    emoji: "💬",
    title: "Free chat",
    desc: "Talk about anything you like",
    opener:
      "Hi! I'm your FlowChat partner today 😊 What would you like to talk about?",
  },
];
