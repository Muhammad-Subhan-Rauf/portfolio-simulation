import React from 'react';
import { TEXTS } from '../constants';

function Header({ operatorName }) {
  return (
    <>
      <div className="headerContainer">
        <div className="headerContent">
          <div className="headerImage">
            <img src="/HeaderImage.png" alt="logo" />
          </div>
          <div className="textContainer">
            <div className="knighterText">
              <span className="line"></span>
              <h1>KNIGHTER</h1>
              <span className="line"></span>
            </div>
            <p>HIGH-END DESIGN & TECHNOLOGIES,</p>
            <p>VENICE</p>
          </div>
        </div>
      </div>
      <h2>{TEXTS.header.replace('{operatorName}', operatorName)}</h2>
    </>
  );
}

// ... component code remains the same
export default React.memo(Header);