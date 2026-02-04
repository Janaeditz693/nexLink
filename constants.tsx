
import { User, Post, Match } from './types';

export const MOCK_USERS: Record<string, User> = {
  alex: {
    id: 'me',
    name: 'Alex Rivera',
    role: 'Lead Product Designer',
    company: 'Vibe',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAY0kzIZZlnO7NZTzcdA_3vQenwwjXqEMkEgve6ai3eRQsGt8W3qAotAv4IDtGDcdMnIR-5bWV3PPM4fOZlRwTABVOqUJRKp_ftLPbG-Z72WwAnzv6iQxPCR1EwNPROAGKCr6wuIvSyik1viqg04TfYUFJsS6EJPTZSdpf7yTtV_tV0ChzUodr5P3gRQwVQN3_NLqycd1RXW1lO_qYacEOYdfTO9nhgsa940n4ZeybDklGTTdsl6ZTYw5FWrTjYF-t0TUQvvwl8hMk',
    isVerified: true,
    bio: 'Product Designer & Tech Enthusiast | Building the future of social UX |  Design Award Winner',
    location: 'New York, NY',
    followers: '4.2k',
    following: '850',
    posts: 128
  },
  sophia: {
    id: '2',
    name: 'Sophia Chen',
    role: 'Founder',
    company: 'Nova AI',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVCVVm2Se7t92qQEkKzL8M3ooKVUgdMFqwxwO5_nY39_EEKBMY0HbPRSWttsTNLxiERF20zRR6piFqP-O-M7_mh6MiWc-nzfzIOU7WUvzvGjOL7QF86NHV1fGGLfpp4BmXY0b32I1n4JzzIXb3PrqhC8ypkgO7hp0MUTYHqwLfW2cMMesfMIJHpn3s8DAXy6EAnorbXm09iqlg2p_bUDdA4-eV7mIv_v5hBPPky_hb4aE2SeFF1gSLSazMbLrtUqKYMMmzqtUR28c',
    isVerified: true,
    bio: 'Building the next generation of neural interfaces. Coffee and Code.',
    location: 'San Francisco, CA',
    followers: '8.1k',
    following: '420',
    posts: 56
  },
  marcus: {
    id: '3',
    name: 'Marcus Thorne',
    role: '3D Artist',
    company: 'Epic Studios',
    avatar: 'https://picsum.photos/400/400?random=11',
    isVerified: true,
    bio: 'Unreal Engine enthusiast. Creating worlds that dont exist yet.',
    location: 'London, UK',
    followers: '12.4k',
    following: '1.1k',
    posts: 245
  },
  elena: {
    id: '4',
    name: 'Elena Vance',
    role: 'UX Researcher',
    company: 'Google',
    avatar: 'https://picsum.photos/400/400?random=12',
    isVerified: true,
    bio: 'Understanding human behavior to build better products.',
    location: 'Mountain View, CA',
    followers: '3.5k',
    following: '900',
    posts: 89
  },
  sarah: {
    id: 'u1',
    name: 'Sarah Jenkins',
    role: 'Fashion Stylist',
    company: 'Vogue',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTQ-FrqemlnTEcjJquKWkyT7y3y4k9TLRjoMEbKnktaSQxT9w08MyBRDSaH_V-k6m2BX3MvNUd_16g9um4A1bIGzCBpCAbVfjUL_OPHbQYfCjL5zao5FL59ecVaxpcricEG3lH0FuiSeXW_dpWOPncxtfwM4G409pDvPDJXJUf-miL1LD5n5L2mzu7yR9yBniP6oqEuvhHKzJ6jDWjM_4o8KsRtlwMKsR9Fj3Blflox6jslJmKF9URKkPC58fmCvg3LcU8HTVSkK8',
    isVerified: true,
    bio: 'Sustainability in luxury fashion. Creative Director at various boutiques.',
    location: 'Paris, FR',
    followers: '15.2k',
    following: '1.4k',
    posts: 324
  }
};

export const MOCK_USER = MOCK_USERS.alex;

export const MOCK_POSTS: Post[] = [
  {
    id: '1',
    author: MOCK_USERS.alex,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBl8lemhfb7c2iOWhg40zeyXewvRFDRpzBygmvOvQZgzy27ZlaekOe0yzGw00yE5dNVz0fTNLOIfbqGaJcRnMOB1KoWxzd6C1iGO6GuChf7mdi9V9neVkK2U4yliAm7MN0KWXKYU91enF8LgvzbTQ9uDmMz4-WSiRG6NSNNeGVlh8RybRflX1it_gHbqKEzamdPw9JATbXfUACUSx5ugjEYx3fjqULm6taMQ-Ot0KIR4_FmRiF7x_yu-0b-WcsLGysPvz9jQU4ahvU',
    content: "Just wrapped up the design system for our new mobile dashboard. Focused on high-contrast accessibility and spatial depth. #UIUX #DesignSystems",
    tags: ['UIUX', 'DesignSystems', 'Fintech'],
    likes: '1.2k',
    comments: 84,
    shares: 12,
    timeAgo: '2h ago'
  },
  {
    id: 'p2',
    author: MOCK_USERS.alex,
    image: 'https://picsum.photos/800/1000?random=201',
    content: "Exploring some glassmorphism iterations for the profile settings. Which one do you prefer? Left or right? 🧪",
    tags: ['Glassmorphism', 'ProductDesign', 'AppleDesign'],
    likes: '942',
    comments: 56,
    shares: 8,
    timeAgo: '1d ago'
  },
  {
    id: 'p3',
    author: MOCK_USERS.alex,
    image: 'https://picsum.photos/800/1000?random=202',
    content: "Monday morning workspace setup. Keeping it minimal helps me stay focused on deep work. ☕️💻",
    tags: ['Setup', 'DeskGoals', 'Minimalist'],
    likes: '2.1k',
    comments: 112,
    shares: 45,
    timeAgo: '2d ago'
  },
  {
    id: 's1',
    author: MOCK_USERS.sophia,
    image: 'https://picsum.photos/800/1000?random=301',
    content: "The future of AI is agentic. We are building the tools to make it a reality. #AI #Innovation",
    tags: ['AI', 'Tech', 'Future'],
    likes: '4.5k',
    comments: 210,
    shares: 92,
    timeAgo: '4h ago'
  },
  {
    id: 'm1_p',
    author: MOCK_USERS.marcus,
    image: 'https://picsum.photos/800/1000?random=101',
    content: "Experimenting with real-time raytracing in Unreal Engine 5. The lighting possibilities are becoming indistinguishable from reality.",
    tags: ['Creative', '3D', 'UnrealEngine'],
    likes: '850',
    comments: 42,
    shares: 15,
    timeAgo: '6h ago'
  },
  {
    id: 'p4',
    author: MOCK_USERS.alex,
    image: 'https://picsum.photos/800/1000?random=203',
    content: "New case study live on Behance! A deep dive into the UX of decentralized finance.",
    tags: ['DeFi', 'UXCaseStudy', 'Blockchain'],
    likes: '1.5k',
    comments: 32,
    shares: 20,
    timeAgo: '4d ago'
  },
  {
    id: 'e1_p',
    author: MOCK_USERS.elena,
    image: 'https://picsum.photos/800/1000?random=401',
    content: "Qualitative research is the soul of product strategy. Listening to users changed my entire approach to this feature.",
    tags: ['UserResearch', 'UX', 'Strategy'],
    likes: '620',
    comments: 28,
    shares: 12,
    timeAgo: '1d ago'
  }
];

export const MOCK_MATCHES: Match[] = [
  {
    id: 'm1',
    user: MOCK_USERS.sarah,
    matchScore: 98,
    reach: '850k Reach',
    engagement: '5.8%',
    interests: ['Sustainability', 'Luxury Fashion', 'Lifestyle']
  },
  {
    id: 'm2',
    user: MOCK_USERS.marcus,
    matchScore: 92,
    reach: '1.2M Reach',
    engagement: '7.2%',
    interests: ['Tech', 'Creative', '3D Design']
  },
  {
    id: 'm3',
    user: MOCK_USERS.elena,
    matchScore: 89,
    reach: '45k Reach',
    engagement: '12.4%',
    interests: ['Tech', 'UX Research', 'Mentorship']
  }
];
