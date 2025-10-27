import React from "react";
import "./Footer.css";

const Footer = () => {

  return (
    <div className="footer-container">

      <div className="footer-links-section">
        <div className="footer-links-wrapper">
          <a
            href={import.meta.env.VITE_PRIVACY_POLICY_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            confidential project
          </a>

          <div className="footer-brand">
            <p className="footer-powered">Powered by</p>
            <div className="footer-brand-name">KNIGHTER</div>
            <div className="footer-brand-subtext">
              HIGH-END DESIGN & TECHNOLOGIES
            </div>
          </div>

          <a
            href={import.meta.env.VITE_TERM_OF_USE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            confidential project
          </a>
        </div>
      </div>
    </div>
  );
};

export default Footer;
