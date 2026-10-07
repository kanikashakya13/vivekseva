/**
 * VivekSeva - Core Data Store & Initial State
 * Inspired by the ideals of Swami Vivekananda:
 * "Serve. Connect. Grow."
 * "Not your rank. Your growth."
 */

const VIVEK_INITIAL_DATA = {
  // 4 Service Categories ONLY as mandated by specification
  categories: {
    food: {
      id: "food",
      name: "Food Seva",
      icon: "fa-bowl-food",
      color: "orange",
      tagline: "Share nourishment. Serve with dignity.",
      quote: "They alone live who live for others, the rest are more dead than alive.",
      quoteSource: "Swami Vivekananda (Complete Works, Vol. 4)",
      description: "Connect people who need food-related support with suitable helpers, volunteers, communities or NGOs.",
      needs: [
        "Meal assistance",
        "Food distribution",
        "Ration/basic food support",
        "Community food drives"
      ],
      skills: [
        "Food distribution",
        "Meal preparation",
        "Food collection",
        "Food drive volunteering"
      ]
    },
    education: {
      id: "education",
      name: "Education Seva",
      icon: "fa-graduation-cap",
      color: "blue",
      tagline: "Share knowledge. Empower a life.",
      quote: "Education is the manifestation of the perfection already in man.",
      quoteSource: "Swami Vivekananda (Complete Works, Vol. 4)",
      description: "Connect learners who need educational support with helpers willing to teach or guide them.",
      needs: [
        "School subject help",
        "Homework support",
        "Basic literacy",
        "Mathematics",
        "General academic guidance",
        "Computer/basic learning"
      ],
      skills: [
        "Mathematics",
        "Science",
        "English",
        "School subjects",
        "Basic literacy",
        "General academic guidance"
      ]
    },
    elderly: {
      id: "elderly",
      name: "Elderly Support",
      icon: "fa-person-cane",
      color: "amber",
      tagline: "Give time. Give dignity.",
      quote: "They alone live who live for others, the rest are more dead than alive.",
      quoteSource: "Swami Vivekananda (Complete Works, Vol. 4)",
      description: "Provide respectful human assistance and companionship to elderly people. (Not professional medical care).",
      needs: [
        "Companionship",
        "Reading/writing assistance",
        "Basic daily assistance",
        "Help with simple digital tasks",
        "Accompanying support"
      ],
      skills: [
        "Companionship",
        "Reading/writing assistance",
        "Basic daily assistance",
        "Help with simple digital tasks",
        "Accompanying support"
      ]
    },
    spiritual: {
      id: "spiritual",
      name: "Spiritual Support",
      icon: "fa-om",
      color: "purple",
      tagline: "Find peace. Share positivity.",
      quote: "Purity, patience, and perseverance are the three essentials to success and, above all, love.",
      quoteSource: "Swami Vivekananda (Complete Works, Vol. 5)",
      description: "Provide a respectful space for spiritual discussion, meditation, positive companionship and connection with suitable resources. Universal and non-sectarian.",
      needs: [
        "Motivational Speech in College / Youth Session",
        "Meditation",
        "Spiritual discussion",
        "Positive companionship",
        "Guided spiritual/well-being sessions",
        "Connection to spiritual resources"
      ],
      skills: [
        "College Motivational Speech",
        "Youth Mentorship & Guidance",
        "Character Building Workshop",
        "Student Stress Management",
        "Vivekananda Youth Philosophy",
        "Guided meditation",
        "Spiritual discussion",
        "Positive companionship",
        "Mindful breathing & wellness",
        "Spiritual literature reading"
      ]
    }
  },

  // Levels configuration based on points (NOT ranks)
  levels: [
    { level: 1, name: "Seva Beginner", minPoints: 0, maxPoints: 250, badge: "🌱" },
    { level: 2, name: "Active Helper", minPoints: 251, maxPoints: 600, badge: "🌿" },
    { level: 3, name: "Dedicated Helper", minPoints: 601, maxPoints: 1200, badge: "🌸" },
    { level: 4, name: "Community Helper", minPoints: 1201, maxPoints: 2000, badge: "🌳" },
    { level: 5, name: "Seva Champion", minPoints: 2001, maxPoints: 99999, badge: "🌟" }
  ],

  // Achievements master list
  achievements: [
    {
      id: "ach_first_seva",
      title: "First Seva",
      description: "Completed your first meaningful act of service on VivekSeva.",
      icon: "fa-seedling",
      category: "milestone",
      pointsReward: 50,
      condition: "services >= 1"
    },
    {
      id: "ach_5_services",
      title: "5 Services Milestone",
      description: "Completed 5 acts of selfless service.",
      icon: "fa-hand-holding-heart",
      category: "milestone",
      pointsReward: 100,
      condition: "services >= 5"
    },
    {
      id: "ach_10_services",
      title: "10 Services Milestone",
      description: "Completed 10 acts of service. A true pillar of seva.",
      icon: "fa-award",
      category: "milestone",
      pointsReward: 200,
      condition: "services >= 10"
    },
    {
      id: "ach_25_services",
      title: "25 Services Milestone",
      description: "Completed 25 transformative acts of service.",
      icon: "fa-crown",
      category: "milestone",
      pointsReward: 350,
      condition: "services >= 25"
    },
    {
      id: "ach_consistent",
      title: "Consistent Helper",
      description: "Maintained regular service for 4+ consecutive weeks.",
      icon: "fa-calendar-check",
      category: "consistency",
      pointsReward: 150,
      condition: "consistencyWeeks >= 4"
    },
    {
      id: "ach_food_seva",
      title: "Food Seva Hero",
      description: "Nourished lives by completing 3+ Food Seva activities.",
      icon: "fa-bowl-rice",
      category: "category",
      pointsReward: 100,
      condition: "categoryFood >= 3"
    },
    {
      id: "ach_edu_seva",
      title: "Education Seva Champion",
      description: "Ignited young minds by conducting 3+ Education Seva sessions.",
      icon: "fa-book-open-reader",
      category: "category",
      pointsReward: 100,
      condition: "categoryEducation >= 3"
    },
    {
      id: "ach_elderly",
      title: "Elderly Care Angel",
      description: "Offered warmth, dignity and time to elders in 3+ sessions.",
      icon: "fa-heart-circle-check",
      category: "category",
      pointsReward: 100,
      condition: "categoryElderly >= 3"
    },
    {
      id: "ach_spiritual",
      title: "Spiritual Guide",
      description: "Shared peace, meditation and positivity in 3+ spiritual sessions.",
      icon: "fa-spa",
      category: "category",
      pointsReward: 100,
      condition: "categorySpiritual >= 3"
    },
    {
      id: "ach_sharing",
      title: "Spreading the Light",
      description: "Helped expand the circle of service by sharing VivekSeva with others.",
      icon: "fa-share-nodes",
      category: "community",
      pointsReward: 50,
      condition: "sharesCount >= 1"
    }
  ],

  // Pre-seeded Registered Users (Helper, Needer, and Dual Role)
  users: [
    {
      id: "usr_helper_arjun",
      name: "Arjun Sharma",
      email: "arjun@vivekseva.org",
      phone: "+91 98765 43210",
      location: "South Delhi, Delhi",
      roles: ["helper"], // helper, needer, or both
      currentActiveRole: "helper",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      intro: "Software engineer and weekend educator. I believe teaching is the highest form of service. Happy to guide school students in Math and Science or assist elderly neighbors with daily tasks.",
      serviceMode: "BOTH", // ONLINE, OFFLINE, BOTH
      categories: ["education", "elderly", "food", "spiritual"],
      skills: ["Mathematics", "Science", "School subjects", "Companionship", "Help with simple digital tasks", "Food distribution", "Youth Mentorship & Guidance", "College Motivational Speech"],
      
      // Availability settings
      availability: {
        isAvailableNow: true,
        isPaused: false,
        availableToday: true,
        status: "AVAILABLE NOW", // AVAILABLE NOW, AVAILABLE LATER, NOT AVAILABLE
        weeklySchedule: {
          Monday: [{ start: "18:00", end: "20:00" }],
          Wednesday: [{ start: "18:00", end: "20:00" }],
          Friday: [{ start: "18:00", end: "20:00" }],
          Saturday: [{ start: "10:00", end: "14:00" }, { start: "17:00", end: "20:00" }],
          Sunday: [{ start: "09:00", end: "13:00" }]
        }
      },

      // Personal Growth Data ("WHAT CHANGES IN YOU")
      growth: {
        level: 3,
        levelName: "Dedicated Helper",
        points: 720,
        pointsToNextLevel: 80, // Next level 4 starts at 800 (1201 in full scale, here 720 / 800)
        servicesCompleted: 18,
        serviceHours: 27,
        peopleSupported: 12,
        consistencyWeeks: 6,
        categoryCounts: {
          education: 9,
          food: 5,
          elderly: 4,
          spiritual: 0
        },
        sharesCount: 3,
        // Historical comparison
        historyStart: {
          level: 1,
          points: 0,
          services: 0,
          date: "2026-06-15"
        },
        reflections: [
          "Seva has taught me immense patience. Seeing children grasp mathematical concepts fills me with renewed humility.",
          "Listening to elderly stories made me realize companionship is often more healing than material gifts."
        ]
      },

      unlockedAchievements: ["ach_first_seva", "ach_5_services", "ach_10_services", "ach_consistent", "ach_edu_seva", "ach_food_seva", "ach_sharing"],
      
      certificates: [
        {
          id: "VS-CERT-2026-0104",
          milestone: "10 Services Milestone",
          title: "Certificate of Dedicated Seva",
          contribution: "Completed 10 community seva sessions totaling 18 hours across Education and Food Seva.",
          date: "2026-08-20",
          issuedBy: "VivekSeva Platform"
        },
        {
          id: "VS-CERT-2026-0038",
          milestone: "First Seva",
          title: "Certificate of Seva Initiation",
          contribution: "Stepped forward into the noble journey of selfless service inspired by Swami Vivekananda.",
          date: "2026-06-18",
          issuedBy: "VivekSeva Platform"
        }
      ]
    },

    {
      id: "usr_helper_meenakshi",
      name: "Dr. Meenakshi Sundaram",
      email: "meenakshi@vivekseva.org",
      phone: "+91 94440 12345",
      location: "Mylapore, Chennai, Tamil Nadu",
      roles: ["helper"],
      currentActiveRole: "helper",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
      intro: "Retired professor of philosophy and mindfulness practitioner. Offering compassionate listening, meditation guidance, and Vedic philosophical companionship for peace and character strength.",
      serviceMode: "BOTH",
      categories: ["spiritual", "elderly"],
      skills: ["College Motivational Speech", "Youth Mentorship & Guidance", "Character Building Workshop", "Student Stress Management", "Vivekananda Youth Philosophy", "Guided meditation", "Spiritual discussion", "Positive companionship", "Companionship", "Reading/writing assistance"],
      availability: {
        isAvailableNow: true,
        isPaused: false,
        availableToday: true,
        status: "AVAILABLE NOW",
        weeklySchedule: {
          Tuesday: [{ start: "07:00", end: "09:00" }, { start: "17:00", end: "19:00" }],
          Thursday: [{ start: "07:00", end: "09:00" }, { start: "17:00", end: "19:00" }],
          Saturday: [{ start: "08:00", end: "11:00" }],
          Sunday: [{ start: "08:00", end: "11:00" }]
        }
      },
      growth: {
        level: 3,
        levelName: "Dedicated Helper",
        points: 840,
        pointsToNextLevel: 361,
        servicesCompleted: 21,
        serviceHours: 35,
        peopleSupported: 15,
        consistencyWeeks: 8,
        categoryCounts: { spiritual: 14, elderly: 7, education: 0, food: 0 },
        sharesCount: 2,
        historyStart: { level: 1, points: 0, services: 0, date: "2026-05-10" },
        reflections: [
          "Spiritual companionship is about being an anchor of calm for someone experiencing turbulent thoughts."
        ]
      },
      unlockedAchievements: ["ach_first_seva", "ach_5_services", "ach_10_services", "ach_consistent", "ach_spiritual", "ach_elderly", "ach_sharing"],
      certificates: [
        {
          id: "VS-CERT-2026-0089",
          milestone: "10 Services Milestone",
          title: "Certificate of Dedicated Seva",
          contribution: "Facilitated over 20 mindfulness and elder companionship sessions with utmost reverence.",
          date: "2026-07-15",
          issuedBy: "VivekSeva Platform"
        }
      ]
    },

    {
      id: "usr_helper_rajesh",
      name: "Rajesh K. Verma",
      email: "rajesh@vivekseva.org",
      phone: "+91 98112 34567",
      location: "Gomti Nagar, Lucknow, Uttar Pradesh",
      roles: ["helper"],
      currentActiveRole: "helper",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
      intro: "Community volunteer coordinating ration distribution and food drives. Believe in 'Daridra Narayana' - serving nutritious meals with respect and warm smiles.",
      serviceMode: "OFFLINE",
      categories: ["food"],
      skills: ["Food distribution", "Meal preparation", "Food collection", "Food drive volunteering"],
      availability: {
        isAvailableNow: false,
        isPaused: false,
        availableToday: false,
        status: "AVAILABLE LATER",
        weeklySchedule: {
          Saturday: [{ start: "08:00", end: "14:00" }],
          Sunday: [{ start: "08:00", end: "14:00" }]
        }
      },
      growth: {
        level: 2,
        levelName: "Active Helper",
        points: 430,
        pointsToNextLevel: 171,
        servicesCompleted: 9,
        serviceHours: 18,
        peopleSupported: 42,
        consistencyWeeks: 3,
        categoryCounts: { food: 9, education: 0, elderly: 0, spiritual: 0 },
        sharesCount: 1,
        historyStart: { level: 1, points: 0, services: 0, date: "2026-08-01" },
        reflections: ["Serving food directly to families has grounded me completely."]
      },
      unlockedAchievements: ["ach_first_seva", "ach_5_services", "ach_food_seva", "ach_sharing"],
      certificates: [
        {
          id: "VS-CERT-2026-0155",
          milestone: "First Seva",
          title: "Certificate of Seva Initiation",
          contribution: "Completed first community ration seva with reverence and compassion.",
          date: "2026-08-05",
          issuedBy: "VivekSeva Platform"
        }
      ]
    },

    {
      id: "usr_helper_sneha",
      name: "Sneha Mukhopadhyay",
      email: "sneha@vivekseva.org",
      phone: "+91 98300 45678",
      location: "Salt Lake, Kolkata, West Bengal",
      roles: ["helper"],
      currentActiveRole: "helper",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
      intro: "Passionate educator and literary tutor. Helping high school and primary students develop confidence in English, Science and Basic Literacy. Serving is growing.",
      serviceMode: "ONLINE",
      categories: ["education"],
      skills: ["English", "Science", "Basic literacy", "General academic guidance"],
      availability: {
        isAvailableNow: true,
        isPaused: false,
        availableToday: true,
        status: "AVAILABLE NOW",
        weeklySchedule: {
          Monday: [{ start: "16:00", end: "19:00" }],
          Wednesday: [{ start: "16:00", end: "19:00" }],
          Thursday: [{ start: "16:00", end: "19:00" }],
          Saturday: [{ start: "15:00", end: "18:00" }]
        }
      },
      growth: {
        level: 2,
        levelName: "Active Helper",
        points: 510,
        pointsToNextLevel: 91,
        servicesCompleted: 11,
        serviceHours: 16,
        peopleSupported: 8,
        consistencyWeeks: 5,
        categoryCounts: { education: 11, food: 0, elderly: 0, spiritual: 0 },
        sharesCount: 2,
        historyStart: { level: 1, points: 0, services: 0, date: "2026-07-02" },
        reflections: ["Seeing a shy student speak confident English is the greatest blessing."]
      },
      unlockedAchievements: ["ach_first_seva", "ach_5_services", "ach_10_services", "ach_edu_seva", "ach_consistent", "ach_sharing"],
      certificates: [
        {
          id: "VS-CERT-2026-0120",
          milestone: "10 Services Milestone",
          title: "Certificate of Dedicated Seva",
          contribution: "Completed 10 online tutoring seva sessions for students from disadvantaged backgrounds.",
          date: "2026-09-12",
          issuedBy: "VivekSeva Platform"
        }
      ]
    },

    // Needer: Sunita Devi
    {
      id: "usr_needer_sunita",
      name: "Sunita Devi",
      email: "sunita@vivekseva.org",
      phone: "+91 94150 99881",
      location: "Dashashwamedh, Varanasi, Uttar Pradesh",
      roles: ["needer"],
      currentActiveRole: "needer",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
      intro: "Senior citizen living independently. Seeking occasional assistance with grocery pickup, reading government pension documents, and friendly companionship.",
      serviceMode: "OFFLINE",
      categories: ["elderly", "food"],
      skills: []
    },

    // Dual-Role User: Priya Nair (can act as Helper AND Needer with 1-click Switch Role)
    {
      id: "usr_dual_priya",
      name: "Priya Nair",
      email: "priya@vivekseva.org",
      phone: "+91 98450 67890",
      location: "Indiranagar, Bengaluru, Karnataka",
      roles: ["helper", "needer"], // Dual role!
      currentActiveRole: "helper",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80",
      intro: "Content writer and community advocate. As a helper, I assist senior citizens with digital devices and reading. As a needer, I occasionally request education mentorship for my younger niece in mathematics.",
      serviceMode: "BOTH",
      categories: ["elderly", "education"],
      skills: ["Companionship", "Help with simple digital tasks", "Reading/writing assistance", "English"],
      availability: {
        isAvailableNow: true,
        isPaused: false,
        availableToday: true,
        status: "AVAILABLE NOW",
        weeklySchedule: {
          Saturday: [{ start: "14:00", end: "18:00" }],
          Sunday: [{ start: "10:00", end: "14:00" }]
        }
      },
      growth: {
        level: 2,
        levelName: "Active Helper",
        points: 360,
        pointsToNextLevel: 241,
        servicesCompleted: 7,
        serviceHours: 11,
        peopleSupported: 5,
        consistencyWeeks: 3,
        categoryCounts: { elderly: 5, education: 2, food: 0, spiritual: 0 },
        sharesCount: 1,
        historyStart: { level: 1, points: 0, services: 0, date: "2026-08-10" },
        reflections: ["Balancing helping others and asking for help makes one truly humble."]
      },
      unlockedAchievements: ["ach_first_seva", "ach_5_services", "ach_elderly", "ach_sharing"],
      certificates: [
        {
          id: "VS-CERT-2026-0188",
          milestone: "First Seva",
          title: "Certificate of Seva Initiation",
          contribution: "Completed first elder companionship session with high respect.",
          date: "2026-08-14",
          issuedBy: "VivekSeva Platform"
        }
      ]
    }
  ],

  // Requests Pipeline across all statuses
  requests: [
    {
      id: "REQ-2026-001",
      neederId: "usr_needer_sunita",
      neederName: "Sunita Devi",
      category: "elderly",
      title: "Weekly Companionship & Reading Newspaper / Letters",
      description: "Looking for a kind helper to spend 1-2 hours reading recent Bengali/Hindi books, letters from family, and sharing gentle conversation.",
      preferredDate: "2026-10-10",
      preferredTime: "16:00 - 18:00",
      duration: "2 hours",
      serviceMode: "OFFLINE",
      approxLocation: "Dashashwamedh, Varanasi",
      categoryFields: {
        assistanceType: "Companionship & Reading/Writing",
        preferredTiming: "Late afternoon",
        duration: "2 hours"
      },
      status: "REQUESTED", // REQUESTED, ACCEPTED, SCHEDULED, IN PROGRESS, COMPLETED, DECLINED, CANCELLED
      assignedHelperId: "usr_helper_arjun",
      assignedHelperName: "Arjun Sharma",
      matchScore: 94,
      createdAt: "2026-10-05T10:30:00Z"
    },
    {
      id: "REQ-2026-002",
      neederId: "usr_needer_sunita",
      neederName: "Sunita Devi",
      category: "food",
      title: "Fortnightly Dry Ration Kit Assistance for 2 Elderly Persons",
      description: "Need help collecting and bringing a monthly staple ration kit (rice, dal, cooking oil, flour) from the local community store.",
      preferredDate: "2026-10-08",
      preferredTime: "10:00 - 11:30",
      duration: "1.5 hours",
      serviceMode: "OFFLINE",
      approxLocation: "Dashashwamedh, Varanasi",
      categoryFields: {
        foodType: "Ration/basic food support",
        numberOfPeople: "2 elders",
        preferredTiming: "Morning 10 AM"
      },
      status: "SCHEDULED",
      assignedHelperId: "usr_helper_rajesh",
      assignedHelperName: "Rajesh K. Verma",
      matchScore: 92,
      scheduledDate: "2026-10-08",
      scheduledTime: "10:00 AM",
      createdAt: "2026-10-03T14:15:00Z"
    },
    {
      id: "REQ-2026-003",
      neederId: "usr_dual_priya",
      neederName: "Priya Nair (for niece Ritu)",
      category: "education",
      title: "Class 10 Board Exam Mathematics Concept Mentorship",
      description: "Looking for an enthusiastic math mentor to explain Quadratic Equations and Trigonometry basics in simple language over video call.",
      preferredDate: "2026-10-07",
      preferredTime: "18:30 - 19:30",
      duration: "1 hour",
      serviceMode: "ONLINE",
      approxLocation: "Bengaluru / Online",
      categoryFields: {
        subject: "Mathematics (Trigonometry & Algebra)",
        educationLevel: "Class 10 Secondary",
        helpType: "Concept clarification & problem solving"
      },
      status: "IN PROGRESS",
      assignedHelperId: "usr_helper_arjun",
      assignedHelperName: "Arjun Sharma",
      matchScore: 98,
      scheduledDate: "2026-10-07",
      scheduledTime: "06:30 PM",
      createdAt: "2026-10-04T09:00:00Z"
    },
    {
      id: "REQ-2026-004",
      neederId: "usr_needer_sunita",
      neederName: "Sunita Devi",
      category: "spiritual",
      title: "Guided Meditation & Reading from Gita for Inner Peace",
      description: "Seeking a calm person to share 45 minutes of mindful breathing, quiet reflection, and reading universal spiritual discourses.",
      preferredDate: "2026-09-28",
      preferredTime: "08:00 - 09:00",
      duration: "1 hour",
      serviceMode: "ONLINE",
      approxLocation: "Online Video / Audio",
      categoryFields: {
        spiritualSupportType: "Meditation & Spiritual Discussion",
        preferredTiming: "Morning 8:00 AM",
        preferredMode: "Online"
      },
      status: "COMPLETED",
      assignedHelperId: "usr_helper_meenakshi",
      assignedHelperName: "Dr. Meenakshi Sundaram",
      matchScore: 96,
      completedAt: "2026-09-28T09:00:00Z",
      pointsAwarded: 110,
      feedbacks: {
        neederFeedback: {
          rating: 5,
          text: "Dr. Meenakshi’s voice and guidance brought deep peace to my heart. She was so respectful and patient.",
          answers: {
            communicationClear: "Yes, perfectly clear",
            serviceCompleted: "Yes, fully completed",
            respectful: "Extremely respectful and kind",
            needFulfilled: "Exceeded expectations"
          },
          date: "2026-09-28"
        },
        helperFeedback: {
          rating: 5,
          text: "A truly divine interaction. Smt. Sunita Devi has a beautiful spirit. It was an honor to serve.",
          answers: {
            communicationClear: "Yes",
            serviceCompleted: "Yes",
            respectful: "Yes, very warm",
            needFulfilled: "Yes"
          },
          date: "2026-09-28"
        }
      },
      createdAt: "2026-09-25T11:00:00Z"
    },
    {
      id: "REQ-2026-005",
      neederId: "usr_needer_sunita",
      neederName: "Sunita Devi",
      category: "food",
      title: "Prepared Meal Distribution Assistance for Senior Home",
      description: "Distribute hot nutritious lunch boxes to 8 seniors residing in the community colony.",
      preferredDate: "2026-09-20",
      preferredTime: "12:00 - 13:30",
      duration: "1.5 hours",
      serviceMode: "OFFLINE",
      approxLocation: "Varanasi",
      status: "COMPLETED",
      assignedHelperId: "usr_helper_arjun",
      assignedHelperName: "Arjun Sharma",
      matchScore: 90,
      completedAt: "2026-09-20T13:30:00Z",
      pointsAwarded: 120,
      feedbacks: {
        neederFeedback: {
          rating: 5,
          text: "Arjun served all meals with utmost humility and broad smiles. The seniors blessed him warmly.",
          answers: {
            communicationClear: "Yes",
            serviceCompleted: "Yes",
            respectful: "Yes",
            needFulfilled: "Yes"
          },
          date: "2026-09-20"
        },
        helperFeedback: {
          rating: 5,
          text: "Deeply fulfilling seva. Every elder greeted me like family.",
          answers: {
            communicationClear: "Yes",
            serviceCompleted: "Yes",
            respectful: "Yes",
            needFulfilled: "Yes"
          },
          date: "2026-09-20"
        }
      },
      createdAt: "2026-09-17T15:00:00Z"
    }
  ],

  // In-App Chat Messages (Linked to requests, strictly no exposed phone numbers)
  chats: {
    "REQ-2026-003": [
      {
        id: "msg_1",
        senderId: "usr_dual_priya",
        senderName: "Priya Nair",
        text: "Namaste Arjun! Thank you for accepting the education seva request for my niece Ritu.",
        timestamp: "2026-10-04T09:15:00Z",
        isRead: true
      },
      {
        id: "msg_2",
        senderId: "usr_helper_arjun",
        senderName: "Arjun Sharma",
        text: "Namaste Priya ji! It is an absolute pleasure. Which chapters in Class 10 Math would she like us to focus on first?",
        timestamp: "2026-10-04T09:20:00Z",
        isRead: true
      },
      {
        id: "msg_3",
        senderId: "usr_dual_priya",
        senderName: "Priya Nair",
        text: "Mainly Quadratic Equations and Heights & Distances (Trigonometry). She finds the word problems slightly confusing.",
        timestamp: "2026-10-04T09:25:00Z",
        isRead: true
      },
      {
        id: "msg_4",
        senderId: "usr_helper_arjun",
        senderName: "Arjun Sharma",
        text: "Understood! I have prepared intuitive visual problem diagrams. Let us connect at 6:30 PM through our in-app private session.",
        timestamp: "2026-10-04T09:30:00Z",
        isRead: false
      }
    ],
    "REQ-2026-001": [
      {
        id: "msg_5",
        senderId: "usr_needer_sunita",
        senderName: "Sunita Devi",
        text: "Pranam Arjun beta. Will you be able to visit Dashashwamedh colony on Saturday afternoon?",
        timestamp: "2026-10-05T11:00:00Z",
        isRead: true
      },
      {
        id: "msg_6",
        senderId: "usr_helper_arjun",
        senderName: "Arjun Sharma",
        text: "Pranam Sunita Mata ji. Yes! I will arrive around 4:00 PM. I am bringing a wonderful book of inspiring stories to read together.",
        timestamp: "2026-10-05T11:05:00Z",
        isRead: true
      }
    ]
  },

  // Communities & Partner NGOs (Section 29)
  organizations: [
    {
      id: "ngo_1",
      name: "Sri Ramakrishna Seva Samiti",
      description: "Dedicated to the ideal of 'Atmano Mokshartham Jagat Hitaya Cha' — For one's own spiritual realization and for the welfare of the world.",
      categories: ["food", "education", "spiritual"],
      location: "Kolkata, West Bengal (Pan-India branches)",
      initiatives: "Free evening coaching centers for underprivileged children, daily food distribution, and universal Vedanta reading rooms.",
      verified: true
    },
    {
      id: "ngo_2",
      name: "Akshaya Annadaana Trust",
      description: "Working to ensure that no hungry neighbor goes to sleep without a dignified, warm meal.",
      categories: ["food"],
      location: "Bengaluru & Mysuru, Karnataka",
      initiatives: "Zero-waste community kitchens, senior doorstep meal support, and emergency ration supply.",
      verified: true
    },
    {
      id: "ngo_3",
      name: "Maitri Elders Welfare Society",
      description: "Fostering dignity, love, and emotional security for destitute and solitary senior citizens.",
      categories: ["elderly"],
      location: "Varanasi & Lucknow, Uttar Pradesh",
      initiatives: "Doorstep companionship circles, legal document reading aid, and recreational storytelling clubs.",
      verified: true
    },
    {
      id: "ngo_4",
      name: "Vidya Jyoti Free Education Trust",
      description: "Empowering young learners from underserved urban and rural backgrounds with quality tutoring.",
      categories: ["education"],
      location: "New Delhi & NCR",
      initiatives: "Weekend science and mathematics labs, remedial literacy workshops, and digital education camps.",
      verified: true
    }
  ],

  // Motivational & System Notifications (Section 27 & 30)
  notifications: [
    {
      id: "notif_1",
      userId: "usr_helper_arjun",
      title: "New Seva Request Matched",
      message: "Sunita Devi requested Elderly Companionship & Reading in Varanasi that matches your profile perfectly.",
      type: "request",
      link: "requests",
      timestamp: "2026-10-05T10:30:00Z",
      isRead: false
    },
    {
      id: "notif_2",
      userId: "usr_helper_arjun",
      title: "Level Progress Insight",
      message: "You are 80 points away from Level 4 (Community Helper). Your journey continues with every selfless act.",
      type: "motivational",
      link: "growth",
      timestamp: "2026-10-04T08:00:00Z",
      isRead: false
    },
    {
      id: "notif_3",
      userId: "usr_helper_arjun",
      title: "New Message Received",
      message: "Priya Nair sent you a message regarding the Class 10 Math Seva Session.",
      type: "message",
      link: "messages",
      timestamp: "2026-10-04T09:25:00Z",
      isRead: true
    },
    {
      id: "notif_4",
      userId: "usr_helper_arjun",
      title: "Achievement Unlocked: Consistent Helper",
      message: "You have maintained consistent seva for 6 weeks. Remember: consistency shapes character.",
      type: "achievement",
      link: "achievements",
      timestamp: "2026-09-30T10:00:00Z",
      isRead: true
    },
    {
      id: "notif_5",
      userId: "usr_helper_arjun",
      title: "A Word of Inspiration",
      message: "“They alone live who live for others, the rest are more dead than alive.” Thank you for serving today.",
      type: "motivational",
      link: "growth",
      timestamp: "2026-09-25T07:30:00Z",
      isRead: true
    }
  ],

  // Support & Problem Reports (Section 20)
  reports: [
    {
      id: "REP-2026-0012",
      reporterId: "usr_helper_arjun",
      reporterName: "Arjun Sharma",
      category: "Technical Issue",
      description: "Encountered a slight delay in audio sync during the private call setup on mobile browser.",
      status: "Under Review",
      createdAt: "2026-10-01T14:20:00Z"
    }
  ],

  // Inspirational quotes of Swami Vivekananda
  quotes: [
    {
      quote: "They alone live who live for others, the rest are more dead than alive.",
      source: "Swami Vivekananda (Complete Works, Vol. 4)",
      theme: "Life of Service"
    },
    {
      quote: "Education is the manifestation of the perfection already in man.",
      source: "Swami Vivekananda (Complete Works, Vol. 4)",
      theme: "Education"
    },
    {
      quote: "It is a privilege to serve mankind, for this is the worship of God.",
      source: "Swami Vivekananda (Selfless Seva Yoga)",
      theme: "Daridra Narayana"
    },
    {
      quote: "Purity, patience, and perseverance are the three essentials to success and, above all, love.",
      source: "Swami Vivekananda (Complete Works, Vol. 5)",
      theme: "Character"
    },
    {
      quote: "Never say 'no', never say 'I cannot', for you are infinite. All the power is within you.",
      source: "Swami Vivekananda",
      theme: "Inner Strength"
    },
    {
      quote: "Take up one idea. Make that one idea your life — think of it, dream of it, live on that idea.",
      source: "Swami Vivekananda (Complete Works, Vol. 1)",
      theme: "Youth & Purpose"
    },
    {
      quote: "All power is within you; you can do anything and everything.",
      source: "Swami Vivekananda (Complete Works, Vol. 3)",
      theme: "Leadership & Self-Belief"
    }
  ]
};

// Global export
if (typeof window !== "undefined") {
  window.VIVEK_DATA = VIVEK_INITIAL_DATA;
}
if (typeof globalThis !== "undefined") {
  globalThis.VIVEK_DATA = VIVEK_INITIAL_DATA;
}

