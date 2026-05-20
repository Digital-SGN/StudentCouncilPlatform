import React from 'react';
import '../css/leadershipCard.css';

const LeadershipCard = ({ name, position, photoUrl, rotateAngle }) => {
  return (
    <div 
      className="leadership-card"
      style={{ transform: `rotate(${rotateAngle}deg)` }}
    >
      <div className="card-inner">
        <img src={photoUrl} alt={name} className="card-photo" />
        <h3>{name}</h3>
        <p>{position}</p>
      </div>
    </div>
  );
};

export default LeadershipCard;