import React from 'react';
import { GitHubUser } from '../../types';
import { AUTHOR_NAME } from '../../constants';

export interface FooterProps {
  userProfile: GitHubUser | null;
}

const Footer: React.FC<FooterProps> = ({ userProfile }) => {
  return (
    <footer className="backdrop-blur-md border-t py-2 text-center text-sm mt-auto opacity-90 theme-footer theme-bg-primary theme-border-subtle theme-text-secondary md:fixed md:bottom-0 md:left-0 md:right-0 md:z-40">
      <p>
        © {new Date().getFullYear()} {userProfile?.name || AUTHOR_NAME}. 灵感来自《魔女之旅》。
      </p>
      <div className="flex justify-center gap-4 mt-2 md:hidden">
        <a
          href={userProfile?.html_url || '#'}
          className="hover:opacity-80 transition-colors theme-footer-link"
        >
          GitHub
        </a>
        <a href="#" className="hover:opacity-80 transition-colors theme-footer-link">
          推特
        </a>
        <a href="#" className="hover:opacity-80 transition-colors theme-footer-link">
          ArtStation
        </a>
      </div>
      <div className="hidden md:block">
        <a
          href={userProfile?.html_url || '#'}
          className="mx-4 hover:opacity-80 transition-colors theme-footer-link"
        >
          GitHub
        </a>
        <a href="#" className="mx-4 hover:opacity-80 transition-colors theme-footer-link">
          推特
        </a>
        <a href="#" className="mx-4 hover:opacity-80 transition-colors theme-footer-link">
          ArtStation
        </a>
      </div>
    </footer>
  );
};

export default Footer;