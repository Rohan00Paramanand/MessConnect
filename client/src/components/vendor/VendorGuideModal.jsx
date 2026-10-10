import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  X,
  Languages,
  MessageSquare,
  Clock,
  Star,
  Users,
  Bell,
  LayoutDashboard,
  CheckCircle2,
  Camera,
  MapPin,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  BarChart3
} from 'lucide-react';

const guideContent = {
  en: {
    title: 'Vendor Operations & Portal Guide',
    subtitle: 'Learn how to navigate MessConnect, manage your daily operations, and resolve complaints.',
    selectLanguage: 'Language',
    quickNav: 'Select Module',
    close: 'Close Guide',
    jumpToPage: 'Go to this section',
    modules: [
      {
        id: 'overview',
        title: 'Dashboard & Navigation',
        short: 'Dashboard',
        icon: LayoutDashboard,
        color: 'rose',
        route: '/dashboard/vendor',
        summary: 'Your central hub for quick daily mess monitoring and immediate shortcuts.',
        sections: [
          {
            heading: 'How to Navigate Between Pages',
            steps: [
              'Use the Left Sidebar (or hamburger menu ☰ on mobile) to switch between modules at any time.',
              'Click "Vendor Dashboard" to return to your main management console.',
              'Click the quick-access cards on your home screen for one-tap navigation to Tasks, Timetable, or Reviews.'
            ]
          },
          {
            heading: 'What You See on the Dashboard',
            steps: [
              'Your official registered Company / Mess Name and Profile details.',
              'Shortcut tiles highlighting pending complaint queues and menu schedules.'
            ]
          }
        ]
      },
      {
        id: 'complaints',
        title: 'Handling & Resolving Complaints',
        short: 'Complaints',
        icon: MessageSquare,
        color: 'indigo',
        route: '/complaints',
        summary: 'View student complaints assigned to your mess and resolve them with geotagged live photos.',
        sections: [
          {
            heading: 'Understanding Complaint Statuses',
            steps: [
              'Pending: Complaints submitted by students awaiting Mess Committee review.',
              'Assigned / In Progress: Complaints assigned directly to you for immediate correction.',
              'Vendor Completed: When you have submitted correction proof and are waiting for admin verification.',
              'Resolved: Successfully verified and closed by the committee.'
            ]
          },
          {
            heading: 'How to Resolve a Complaint (Step-by-Step)',
            steps: [
              'Navigate to Complaints (/complaints) from the sidebar.',
              'Locate the task card marked with status "ASSIGNED".',
              'Click the green "Resolve with Photo Proof" button on the task.',
              'A camera window will open. Click "Capture & Geotag" to take a live photo of the rectified issue.',
              'Allow browser location access — the system will automatically stamp live GPS coordinates, address, and timestamp.',
              'Enter optional resolution remarks (e.g., "Cleaned counter", "Fresh food batch prepared").',
              'Click "Submit Resolution" to complete. The status will update to Vendor Completed.'
            ]
          }
        ]
      },
      {
        id: 'timetable',
        title: 'Weekly Meal Timetable',
        short: 'Timetable',
        icon: Clock,
        color: 'teal',
        route: '/timetable',
        summary: 'Keep students informed by updating the meal schedule for Breakfast, Lunch, Snacks, and Dinner.',
        sections: [
          {
            heading: 'How to Update the Meal Schedule',
            steps: [
              'Open Timetable (/timetable) from the sidebar.',
              'You will see a matrix of 7 days (Monday through Sunday) with 4 meal slots each.',
              'Click on any empty slot to add a meal, or click on an existing meal (or its edit pencil icon) to quick fix items.',
              'In the edit popup, review, add, or remove menu items with one click or edit the text.',
              'Click "Update Meal" or "Save Meal". The updated menu will immediately reflect on student dashboards.'
            ]
          },
          {
            heading: 'Best Practices',
            steps: [
              'Update your weekly menu in advance (e.g., every Sunday evening).',
              'Ensure accurate allergen or specialty notes are added in descriptions.'
            ]
          }
        ]
      },
      {
        id: 'feedback',
        title: 'Student Feedback & Reviews',
        short: 'Feedback',
        icon: Star,
        color: 'amber',
        route: '/feedback',
        summary: 'Monitor student satisfaction, star ratings, and detailed food quality reviews.',
        sections: [
          {
            heading: 'How Feedback Works',
            steps: [
              'Students submit ratings (1-5 stars) and comments about meal taste, hygiene, and service.',
              'Open Feedback (/feedback) to inspect daily and weekly satisfaction ratings.',
              'Use positive reviews to motivate staff and low ratings as actionable points for quality improvements.'
            ]
          }
        ]
      },
      {
        id: 'staff',
        title: 'Mess Staff & Worker Directory',
        short: 'Staff',
        icon: Users,
        color: 'emerald',
        route: '/staff',
        summary: 'Maintain your on-site kitchen staff, cooks, and helpers for college compliance.',
        sections: [
          {
            heading: 'Managing Workers',
            steps: [
              'Go to Staff Directory (/staff).',
              'Click "Add New Staff Member" to register a worker.',
              'Enter their Full Name, Contact Number, Role (Head Chef, Assistant Cook, Cleaner, Server), and photo/ID.',
              'Keep staff details updated for university food safety and administrative audits.'
            ]
          }
        ]
      },
      {
        id: 'notices',
        title: 'Notice Board & College Circulars',
        short: 'Notices',
        icon: Bell,
        color: 'blue',
        route: '/notices',
        summary: 'Stay informed about college administration notices, timings, holiday schedules, and audit dates.',
        sections: [
          {
            heading: 'Reading Notices',
            steps: [
              'Visit Notice Board (/notices) regularly.',
              'Notices tagged with "Vendor" or "All" apply to you directly.',
              'Check for special holiday mess schedules, water maintenance notices, or inspection reminders.'
            ]
          }
        ]
      },
      {
        id: 'reports',
        title: 'Monthly Reports & Quality Audits',
        short: 'Monthly Report',
        icon: BarChart3,
        color: 'rose',
        route: '/vendor-reports',
        summary: 'Review your monthly performance infographics, resolution speed (SLA), food ratings, and export official PDF audit reports.',
        sections: [
          {
            heading: 'Understanding Each Infographic & Metric',
            steps: [
              'Complaints & Trend: Shows total complaints logged this month and percentage change compared to the previous month.',
              'Resolution Rate (%): The percentage of assigned complaints you successfully resolved and uploaded live photo proof for.',
              'Resolution Speed (SLA): Shows your average turnaround time in hours, highlighting immediate (<2 hrs), same-day (2-12 hrs), and standard resolutions.',
              'Student Satisfaction (%): Rates student happiness based on real post-resolution feedback (Satisfied vs Unsatisfied).',
              'Dining Quality Scorecard: Breakdown of 1-5 star ratings across Food Quality, Cleanliness, Timeliness, Taste, and Staff Behavior.',
              'Daily Rating Trend: A day-by-day line graph displaying student dining satisfaction across the entire month.',
              'Committee Inspection Log: Official record of student mess committee hygiene visits and observations.'
            ]
          },
          {
            heading: 'How to Generate & Download Official PDF Reports',
            steps: [
              'Navigate to Monthly Report (/vendor-reports) from the sidebar or dashboard.',
              'Use the Month and Year selector at the top to choose the desired audit period.',
              'Click the "Generate Official Document" button.',
              'An official A4 preview sheet will open with trust headers, summary tables, and signature sign-off blocks.',
              'Click "Download PDF / Print" to save the official PDF document or print it directly for administrative compliance.'
            ]
          }
        ]
      }
    ]
  },
  mr: {
    title: 'व्हेंडर ऑपरेशन्स आणि वापरकर्ता मार्गदर्शक',
    subtitle: 'MessConnect कसे वापरावे, दैनंदिन कामे कशी हाताळावी आणि तक्रारींचे निवारण कसे करावे ते शिका.',
    selectLanguage: 'भाषा निवडा',
    quickNav: 'विभाग निवडा',
    close: 'मार्गदर्शक बंद करा',
    jumpToPage: 'या विभागात जा',
    modules: [
      {
        id: 'overview',
        title: 'डॅशबोर्ड आणि नेव्हिगेशन',
        short: 'डॅशबोर्ड',
        icon: LayoutDashboard,
        color: 'rose',
        route: '/dashboard/vendor',
        summary: 'दैनंदिन मेस व्यवस्थापनाचे मुख्य केंद्र जिथून तुम्ही महत्त्वाच्या गोष्टींवर थेट जाऊ शकता.',
        sections: [
          {
            heading: 'विविध विभागांमध्ये कसे जावे?',
            steps: [
              'डाव्या बाजूचा साइडबार (किंवा मोबाईलवर ☰ हॅम्बर्गर मेनू) वापरून कोणत्याही पेजवर कधीही जाता येते.',
              'मुख्य डॅशबोर्डवर परत येण्यासाठी "Vendor Dashboard" वर क्लिक करा.',
              'डॅशबोर्डवरील कार्ड्सवर (Tasks, Timetable, Feedback) एका क्लिकवर त्या त्या विभागात जाता येते.'
            ]
          },
          {
            heading: 'डॅशबोर्डवर काय दिसते?',
            steps: [
              'तुमचे नाव आणि नोंदणीकृत मेस/कंपनीचे नाव.',
              'प्रलंबित कामे, तक्रारी आणि मेनू शेड्यूलचे संक्षिप्त विवरण.'
            ]
          }
        ]
      },
      {
        id: 'complaints',
        title: 'विद्यार्थ्यांच्या तक्रारींचे निवारण',
        short: 'तक्रारी निवारण',
        icon: MessageSquare,
        color: 'indigo',
        route: '/complaints',
        summary: 'तुमच्या मेसला आलेल्या तक्रारी पहा आणि प्रत्यक्ष जागेवरील जिओटॅग फोटोसह त्यांचे निवारण करा.',
        sections: [
          {
            heading: 'तक्रारींचे स्टेटस समजून घ्या',
            steps: [
              'Pending: विद्यार्थ्यांनी केलेली तक्रार, जी कमिटीच्या पुनरावलोकनासाठी प्रलंबित आहे.',
              'Assigned / In Progress: तुमच्याकडे दुरुस्तीसाठी सोपवलेली तक्रार (यावर तुम्हाला काम करायचे आहे).',
              'Vendor Completed: तुम्ही फोटो पुराव्यासह काम पूर्ण केले आहे व ॲडमिन मंजुरीची प्रतीक्षा आहे.',
              'Resolved: कमिटीकडून पडताळणी होऊन पूर्णपणे बंद झालेली तक्रार.'
            ]
          },
          {
            heading: 'तक्रार कशी सोडवावी? (पायरी-दर-पायरी)',
            steps: [
              'साइडबारमधून "Complaints" (/complaints) पेजवर जा.',
              '"ASSIGNED" स्टेटस असलेले तक्रार कार्ड शोधा.',
              'हिरव्या रंगाच्या "Resolve with Photo Proof" बटनावर क्लिक करा.',
              'कॅमेरा स्क्रीन उघडेल. जागेवरील दुरुस्तीचा लाईव्ह फोटो घेण्यासाठी "Capture & Geotag" वर क्लिक करा.',
              'ब्राउझरचे लोकेशन (GPS) चालू ठेवा — सिस्टम आपोआप अचूक ठिकाण (Latitude, Longitude), पत्ता आणि वेळ फोटोवर नोंदवेल.',
              'आवश्यक असल्यास कामाची नोंद लिहा (उदा. "स्वच्छता केली", "नवीन अन्न तयार केले").',
              '"Submit Resolution" दाबा. तक्रारीचे स्टेटस तात्काळ Vendor Completed होईल.'
            ]
          }
        ]
      },
      {
        id: 'timetable',
        title: 'आहार साप्ताहिक वेळापत्रक',
        short: 'वेळापत्रक',
        icon: Clock,
        color: 'teal',
        route: '/timetable',
        summary: 'नाश्ता, दुपारचे जेवण, संध्याकाळचा नाश्ता आणि रात्रीचे जेवण यांचे नियमित वेळापत्रक अपडेट ठेवा.',
        sections: [
          {
            heading: 'मेन्यू कसा अपडेट करावा?',
            steps: [
              'साइडबारमधून "Timetable" (/timetable) उघडा.',
              'सोमवार ते रविवार या ७ दिवसांचे आणि ४ वेळेचे (नाश्ता, जेवण इ.) कोष्टक दिसेल.',
              'नवीन मेन्यू जोडण्यासाठी रिकाम्या स्लॉटवर क्लिक करा, किंवा अस्तित्वात असलेला मेनू बदलण्यासाठी त्यावर किंवा Edit (पेन्सिल) चिन्हावर क्लिक करा.',
              'उघडलेल्या फॉर्ममध्ये पदार्थांची नावे एडिट करा किंवा टॅग्सवरून एका क्लिकवर काढा/जोडा.',
              '"Update Meal" किंवा "Save Meal" वर क्लिक करा. हा नवीन मेनू सर्व विद्यार्थ्यांच्या स्क्रीनवर तात्काळ दिसेल.'
            ]
          },
          {
            heading: 'महत्त्वाच्या टिप्स',
            steps: [
              'आगामी आठवड्याचा मेनू दर रविवारी संध्याकाळीच अपडेट ठेवा.',
              'विद्यार्थ्यांना अन्नाची माहिती अचूक मिळावी म्हणून पदार्थांची नावे स्पष्ट लिहा.'
            ]
          }
        ]
      },
      {
        id: 'feedback',
        title: 'विद्यार्थी अभिप्राय व रेटिंग्ज',
        short: 'अभिप्राय',
        icon: Star,
        color: 'amber',
        route: '/feedback',
        summary: 'विद्यार्थ्यांना अन्न कसे वाटले, त्यांची रेटिंग्ज व सूचना पाहून सेवेचा दर्जा सुधारा.',
        sections: [
          {
            heading: 'फीडबॅक कसा तपासावा?',
            steps: [
              'विद्यार्थी दररोज चव, स्वच्छता आणि सेवेवर १ ते ५ स्टार्स व प्रतिक्रिया देतात.',
              'साइडबारमधील "Feedback" (/feedback) पेजवर जाऊन दैनंदिन रेटिंग्ज पहा.',
              'कमी रेटिंग आलेल्या गोष्टींमध्ये तात्काळ सुधारणा करून मेसची गुणवत्ता उत्तम ठेवा.'
            ]
          }
        ]
      },
      {
        id: 'staff',
        title: 'मेस कर्मचारी डिरेक्टरी',
        short: 'कर्मचारी',
        icon: Users,
        color: 'emerald',
        route: '/staff',
        summary: 'तुमच्या मेसमध्ये काम करणाऱ्या आचारी, मदतनीस आणि इतर कर्मचाऱ्यांची नोंदणी ठेवा.',
        sections: [
          {
            heading: 'कर्मचारी व्यवस्थापन',
            steps: [
              '"Staff Directory" (/staff) पेजवर जा.',
              '"Add New Staff Member" वर क्लिक करून नवीन कर्मचाऱ्याची नोंद करा.',
              'कर्मचाऱ्याचे पूर्ण नाव, मोबाईल नंबर, पद (हेड शेफ, क्लिनर, सर्व्हर) आणि ओळखपत्र जोडा.',
              'कॉलेज प्रशासनाच्या नियमांचे पालन करण्यासाठी कर्मचाऱ्यांची माहिती नेहमी अद्ययावत ठेवा.'
            ]
          }
        ]
      },
      {
        id: 'notices',
        title: 'सूचना फलक व परिपत्रके',
        short: 'सूचना',
        icon: Bell,
        color: 'blue',
        route: '/notices',
        summary: 'कॉलेज ॲडमिनिस्ट्रेशनकडून येणाऱ्या सुट्ट्यांच्या वेळा, पाणी कपात किंवा ऑडिटच्या सूचना जाणून घ्या.',
        sections: [
          {
            heading: 'सूचना कशा पहाव्यात?',
            steps: [
              'नियमितपणे "Notice Board" (/notices) तपासा.',
              '"Vendor" किंवा "All" टॅग असलेल्या सूचना विशेषतः तुमच्यासाठी असतात.',
              'सुट्टीच्या दिवशी मेसची वेळ बदलणे किंवा तपासणीच्या तारखांची माहिती येथे मिळेल.'
            ]
          }
        ]
      },
      {
        id: 'reports',
        title: 'मासिक ऑडिट अहवाल आणि कामगिरी',
        short: 'मासिक अहवाल',
        icon: BarChart3,
        color: 'rose',
        route: '/vendor-reports',
        summary: 'तुमच्या मेसचे मासिक अहवाल, तक्रार निवारणाचा वेग (SLA), अन्नाचा दर्जा रेटिंग्ज आणि अधिकृत PDF रिपोर्ट डाउनलोड करा.',
        sections: [
          {
            heading: 'इन्फोग्राफिक्स आणि आलेखांचा अर्थ समजून घ्या',
            steps: [
              'एकूण तक्रारी (Complaints): या महिन्यात विद्यार्थ्यांनी नोंदवलेल्या एकूण तक्रारी व मागील महिन्याशी तुलनात्मक टक्केवारी.',
              'निवारण दर (Resolution Rate): तुम्ही फोटो पुराव्यासह यशस्वीरित्या सोडवलेल्या तक्रारींचे प्रमाण (टक्केवारीत).',
              'निवारणाचा वेग (Resolution Speed - SLA): तक्रार आल्यापासून ती पूर्ण होईपर्यंत लागलेला सरासरी वेळ (२ तासांच्या आत, २ ते १२ तास, इ.).',
              'विद्यार्थी समाधान (Satisfaction %): तक्रार सुटल्यानंतर विद्यार्थ्यांचे समाधान (समाधानी वि. असमाधानी रेटिंग्ज).',
              'अन्न गुणवत्ता स्कोअरकार्ड (Dining Quality): अन्नाची चव, स्वच्छता, वेळेवर जेवण आणि कर्मचाऱ्यांचे वर्तन यावरील १ ते ५ स्टार्स सरासरी गुण.',
              'दैनंदिन ट्रेंड (Daily Rating Trend): महिन्यातील प्रत्येक दिवसाच्या विद्यार्थ्यांच्या समाधानाचा चढ-उतार दर्शवणारा आलेख.',
              'कमिटी तपासणी लॉग (Inspections): मेस कमिटीने प्रत्यक्ष केलेल्या तपासणीच्या नोंदी व शेरे.'
            ]
          },
          {
            heading: 'अधिकृत PDF अहवाल कसा तयार व डाउनलोड करावा?',
            steps: [
              'साइडबार किंवा डॅशबोर्डवरून "Monthly Report" (/vendor-reports) वर जा.',
              'वर दिलेल्या महिन्याच्या बटणांवरून हवा असलेला महिना व वर्ष निवडा.',
              '"Generate Official Document" या बटनावर क्लिक करा.',
              'कॉलेज ट्रस्टचे नाव, तपशीलवार तक्ते व स्वाक्षरीच्या जागेसह एक परिपूर्ण A4 दस्तऐवज स्क्रीनवर दिसेल.',
              '"Download PDF / Print" वर क्लिक करून अधिकृत PDF सेव्ह करा किंवा थेट प्रिंट काढा.'
            ]
          }
        ]
      }
    ]
  }
};

const VendorGuideModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('vendor_guide_lang') || 'en';
  });
  const [activeModuleId, setActiveModuleId] = useState('overview');

  const content = guideContent[lang] || guideContent.en;
  const currentModule =
    content.modules.find((m) => m.id === activeModuleId) || content.modules[0];

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem('vendor_guide_lang', newLang);
  };

  const handleJump = (route) => {
    onClose();
    navigate(route);
  };

  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100dvh' }}
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* ─── Top Header Bar ─── */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 text-white flex items-center justify-between gap-4 flex-wrap flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight leading-tight">
                  {content.title}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 border border-white/20">
                  <Sparkles size={10} className="text-amber-300" /> Vendor Manual
                </span>
              </div>
              <p className="text-xs text-rose-100 font-medium line-clamp-1 mt-0.5">
                {content.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {/* Language Selector Pills */}
            <div className="inline-flex items-center p-1 bg-black/20 backdrop-blur-md rounded-xl border border-white/20">
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-white text-rose-700 shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('marathi' === lang ? 'mr' : 'mr')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  lang === 'mr'
                    ? 'bg-white text-rose-700 shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                मराठी
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
              title={content.close}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ─── Main Content Layout (Sidebar Tabs + Details View) ─── */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden bg-gray-50/50">
          {/* Left Module Navigation Tabs */}
          <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-100 p-3 sm:p-4 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto flex-shrink-0">
            <p className="hidden md:block text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">
              {content.quickNav}
            </p>
            {content.modules.map((mod) => {
              const Icon = mod.icon;
              const isActive = mod.id === activeModuleId;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setActiveModuleId(mod.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left flex-shrink-0 md:w-full cursor-pointer ${
                    isActive
                      ? 'bg-rose-50 text-rose-900 border border-rose-200/80 shadow-2xs font-black'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                  }`}
                >
                  <Icon
                    size={16}
                    className={isActive ? 'text-rose-600 stroke-[2.5]' : 'text-gray-400'}
                  />
                  <span className="truncate">{mod.short || mod.title}</span>
                </button>
              );
            })}
          </div>

          {/* Right Module Detailed View */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-5">
            {/* Module Banner */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <currentModule.icon size={22} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900">
                    {currentModule.title}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5 leading-relaxed">
                    {currentModule.summary}
                  </p>
                </div>
              </div>

              {currentModule.route && (
                <button
                  type="button"
                  onClick={() => handleJump(currentModule.route)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap self-start sm:self-center"
                >
                  <span>{content.jumpToPage}</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>

            {/* Instruction Sections */}
            <div className="space-y-4">
              {currentModule.sections.map((section, sIdx) => (
                <div
                  key={sIdx}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-2xs space-y-3"
                >
                  <h4 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-rose-500 rounded-full" />
                    {section.heading}
                  </h4>
                  <ul className="space-y-2.5">
                    {section.steps.map((step, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-gray-600 font-medium leading-relaxed flex items-start gap-2.5"
                      >
                        <CheckCircle2
                          size={15}
                          className="text-emerald-500 flex-shrink-0 mt-0.5 stroke-[2.5]"
                        />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Special Callout for Complaints Geotagging when on complaints tab */}
            {currentModule.id === 'complaints' && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs space-y-1.5">
                <p className="font-black flex items-center gap-1.5 text-amber-800">
                  <Camera size={15} className="text-amber-600" />
                  {lang === 'mr' ? 'महत्त्वाची टीप: थेट कॅमेरा फोटो बंधनकारक' : 'Key Note: Live Camera Photo Mandatory'}
                </p>
                <p className="leading-relaxed text-amber-950 font-medium">
                  {lang === 'mr'
                    ? 'तक्रार सोडवताना मोबाईल गॅलरीतून फोटो निवडता येत नाही. पारदर्शकता राखण्यासाठी जागेवर जाऊन थेट कॅमेऱ्याने फोटो काढावा लागतो, ज्यावर आपोआप जीपीएस लोकेशन आणि वेळ नोंदवली जाते.'
                    : 'When marking a complaint completed, gallery uploads are disabled. You must click a real-time live photo from the mess floor with device GPS enabled for transparency.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ─── Footer Action Bar ─── */}
        <div className="p-3 sm:p-4 bg-white border-t border-gray-100 flex items-center justify-between gap-3 flex-shrink-0">
          <p className="text-[11px] text-gray-400 font-medium hidden sm:block">
            {lang === 'mr'
              ? 'कोणत्याही अडथळ्यासाठी मेस कमिटी किंवा कॉलेज ॲडमिनशी संपर्क साधा.'
              : 'Need additional support? Contact the Mess Committee or College Admin.'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all cursor-pointer ml-auto"
          >
            {content.close}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VendorGuideModal;
