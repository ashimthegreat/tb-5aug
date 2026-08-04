export const site = {
  name: "TechBucket",
  tagline: "Serving Nepal's healthcare sector with modern, reliable software since 2019.",
  email: "info@techbucket.com.np",
  phones: [
    { label: "+977 9801151658", href: "tel:+9779801151658" },
    { label: "01-4543897", href: "tel:+97714543897" },
  ],
  address: "Kathmandu, Balaju-16, Bagmati Province, Nepal",
  vatNo: "609605497",
  founded: 2019,
  url: "https://techbucket.com.np",
};

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/#about" },
  { label: "Services", href: "/#services" },
  { label: "Brands", href: "/brands" },
  { label: "Partners", href: "/partners" },
  { label: "Careers", href: "/careers" },
  { label: "Contact Us", href: "/#contact" },
];

export const stats = [
  { value: "5+", label: "Years Experience" },
  { value: "50+", label: "Projects Delivered" },
  { value: "20+", label: "Team Members" },
  { value: "99%", label: "Client Satisfaction" },
];

export const trustPoints = [
  { title: "Healthcare Focused", description: "Every solution is built around real clinical workflows." },
  { title: "Nepal Based", description: "A local team that understands the local health system." },
  { title: "Data Privacy Secure", description: "Encrypted storage and strict access controls by default." },
  { title: "Milestone-Based Projects", description: "Transparent delivery with clearly defined milestones." },
];

export interface Service {
  icon: string;
  title: string;
  description: string;
}

export const services: Service[] = [
  {
    icon: "building",
    title: "Healthcare Management Systems",
    description:
      "End-to-end hospital and clinic management software covering patient registration, OPD/IPD workflows, billing, pharmacy, and laboratory integration.",
  },
  {
    icon: "flask",
    title: "Laboratory Information Systems",
    description:
      "Streamlined LIS solutions for pathology labs — from sample collection and test ordering to result reporting and quality control dashboards.",
  },
  {
    icon: "code",
    title: "Custom Software Development",
    description:
      "Bespoke web and desktop applications built for your specific clinical or administrative workflows, using modern frameworks and agile delivery.",
  },
  {
    icon: "shield",
    title: "Health Data Security",
    description:
      "Comprehensive security audits, encrypted storage, role-based access controls, and compliance reviews to protect sensitive patient data.",
  },
  {
    icon: "chart",
    title: "Healthcare Analytics",
    description:
      "Interactive dashboards and reports that transform clinical and operational data into actionable insights for better decision-making.",
  },
  {
    icon: "mobile",
    title: "Mobile Health Applications",
    description:
      "Patient-facing and provider-facing mobile apps for appointment booking, teleconsultation, medication reminders, and health tracking.",
  },
];

export interface Brand {
  name: string;
  logo: string;
  url?: string;
  blurb: string;
}

export const brands: Brand[] = [
  {
    name: "Oracle Health",
    logo: "/images/brands/oracle-health.jpg",
    url: "https://www.oracle.com/health/",
    blurb: "Enterprise electronic health records and healthcare cloud solutions.",
  },
  {
    name: "Aruba",
    logo: "/images/brands/aruba.jpg",
    url: "https://www.hpe.com/emea_europe/en/networking/hpe-aruba-networking.html",
    blurb: "Secure, AI-powered networking infrastructure for modern hospitals.",
  },
  {
    name: "Imprivata",
    logo: "/images/brands/imprivata.png",
    url: "https://www.imprivata.com/",
    blurb: "Healthcare IT identity, access, and authentication solutions.",
  },
  {
    name: "Medisha",
    logo: "/images/brands/medisha.jpg",
    url: "https://mediisha.app/",
    blurb: "Digital health platform for appointments, records, and communication.",
  },
  {
    name: "Dell",
    logo: "/images/brands/dell.png",
    url: "https://www.dell.com/en-us",
    blurb: "Reliable hardware and end-to-end IT infrastructure solutions.",
  },
  {
    name: "Accops",
    logo: "/images/brands/accops.png",
    url: "https://www.accops.com/",
    blurb: "Virtual desktops and secure remote access for healthcare teams.",
  },
];

export interface Partner {
  name: string;
  logo?: string;
  url?: string;
}

export const partners: Partner[] = [
  { name: "Budhanilkantha Municipal Hospital" },
  { name: "Central Jail Hospital", url: "https://cjhospital.gov.np/" },
  { name: "Chitwan Medical College", logo: "/images/partners/chitwan-medical.png", url: "https://www.cmc.edu.np/" },
  { name: "Dhulikhel Hospital", logo: "/images/partners/dhulikhel.png", url: "https://dhulikhelhospital.org/" },
  { name: "Gaindakot Basic Hospital" },
  { name: "Khwopa Hospital", logo: "/images/partners/khwopa.png", url: "https://khwopahospital.com/" },
  { name: "MoHP — Ministry of Health & Population", url: "https://mohp.gov.np/" },
  { name: "NSI Nick Simons Institute", logo: "/images/partners/nsi.png", url: "https://nsi.edu.np/" },
  { name: "Nepal Police Hospital", logo: "/images/partners/nepal-police.png", url: "https://nph.nepalpolice.gov.np/" },
  { name: "Trishuli Hospital", url: "https://trishulihospital.bagamati.gov.np/" },
];

export const values = [
  {
    title: "Our Mission",
    body: "To democratise healthcare technology in Nepal by delivering affordable, scalable and reliable digital solutions that empower healthcare providers to focus on what matters most — patient care. We believe every clinic, from Kathmandu to the remote hills, deserves world-class software.",
  },
  {
    title: "Our Vision",
    body: "To be the most trusted healthcare technology partner in South Asia — building a future where every healthcare worker has access to digital tools that are as powerful as they are intuitive, enabling Nepal's healthcare system to reach its full potential.",
  },
  {
    title: "Innovation",
    body: "We push the boundaries of healthcare technology with creative solutions that solve real-world clinical challenges.",
  },
  {
    title: "Reliability",
    body: "Healthcare never sleeps. Our systems are built for 99.9% uptime with rock-solid infrastructure and redundancy.",
  },
  {
    title: "Compassion",
    body: "Every line of code we write is in service of better patient outcomes and a healthier Nepal.",
  },
];

export const careerPerks = [
  { icon: "heart", title: "Meaningful Work", description: "Every line of code contributes to better patient outcomes across Nepal." },
  { icon: "book", title: "Continuous Learning", description: "Regular training, knowledge-sharing sessions, and career development opportunities." },
  { icon: "users", title: "Great Team", description: "Collaborative environment where your ideas are heard and celebrated." },
  { icon: "balance", title: "Work-Life Balance", description: "Flexible schedules, generous leave, and a culture that respects your time." },
];
