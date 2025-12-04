import React from 'react';
import { AUTHOR_NAME } from '../../constants';
import { GitHubUser } from '../../services/githubService';

interface FooterProps {
  userProfile: GitHubUser | null;
}

export const Footer: React.FC<FooterProps> = ({ userProfile }) => {
  return (
    <footer className="bg-slate-950/80 backdrop-blur-md border-t border-white/5 py-8 text-center text-slate-500 text-sm mt-auto">
      <p>© {new Date().getFullYear()} {userProfile?.name || AUTHOR_NAME}. 灵感来自《魔女之旅》。</p>
      <div className="flex justify-center gap-4 mt-2">
        <a href={userProfile?.html_url || "#"} className="hover:text-amber-400 transition-colors">GitHub</a>
        <a href="#" className="hover:text-amber-400 transition-colors">推特</a>
        <a href="#" className="hover:text-amber-400 transition-colors">ArtStation</a>
      </div>
    </footer>
  );
};

export default Footer;
