import React from 'react';
import './Loader.css';

const Loader = () => {
  return (
    <div className="loader-container">
      <div className="clinical-spinner">
        <div className="circle-outer"></div>
        <div className="circle-inner"></div>
        <div className="heart-icon">❤️</div>
      </div>
      <p>Consulting Sahaara AI...</p>
    </div>
  );
};

export default Loader;
