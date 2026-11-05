import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube, FaGithub } from 'react-icons/fa';

const SOCIAL = [
    { icon: FaFacebookF, href: '#', label: 'Facebook' },
    { icon: FaInstagram, href: '#', label: 'Instagram' },
    { icon: FaTwitter,   href: '#', label: 'Twitter' },
    { icon: FaYoutube,   href: '#', label: 'YouTube' },
    { icon: FaGithub,    href: '#', label: 'GitHub' },
];

const LINKS = [
    { group: 'Company',    items: ['About Us', 'Jobs', 'Press', 'Media Center'] },
    { group: 'Support',    items: ['Help Center', 'Contact Us', 'Audio Description', 'Cookie Preferences'] },
    { group: 'Legal',      items: ['Privacy Policy', 'Terms of Use', 'Legal Notices', 'Corporate Info'] },
    { group: 'Account',    items: ['Subscription', 'Gift Cards', 'Investor Relations', 'Service Code'] },
];

const Footer = () => (
    <footer className="relative bg-[#0b0b0c] border-t border-white/5 pt-14 pb-8 px-5 sm:px-10 md:px-16 mt-8 overflow-hidden">

        {/* Background glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-24 bg-red-900/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">

            {/* Top: Logo + Social */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 mb-10 pb-8 border-b border-white/5">
                <Link to="/" className="text-2xl font-black tracking-tighter text-white">
                    PULSE<span className="text-red-600">STREAM</span>
                </Link>

                {/* Social icons */}
                <div className="flex items-center gap-4">
                    {SOCIAL.map(({ icon: Icon, href, label }) => (
                        <a
                            key={label}
                            href={href}
                            aria-label={label}
                            className="w-9 h-9 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 hover:scale-110"
                        >
                            <Icon size={14} />
                        </a>
                    ))}
                </div>
            </div>

            {/* Links grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
                {LINKS.map(({ group, items }) => (
                    <div key={group}>
                        <p className="text-gray-300 text-xs font-bold uppercase tracking-widest mb-3">{group}</p>
                        <ul className="space-y-2">
                            {items.map(item => (
                                <li key={item}>
                                    <a href="#" className="text-gray-500 text-sm hover:text-gray-300 transition-colors hover:underline">
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Bottom bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-white/5">
                <p className="text-gray-600 text-xs">
                    © {new Date().getFullYear()} PulseStream, Inc. All rights reserved.
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                    <a href="#" className="hover:text-gray-400 transition-colors">Privacy</a>
                    <span>·</span>
                    <a href="#" className="hover:text-gray-400 transition-colors">Terms</a>
                    <span>·</span>
                    <a href="#" className="hover:text-gray-400 transition-colors">Cookies</a>
                </div>
            </div>
        </div>
    </footer>
);

export default Footer;