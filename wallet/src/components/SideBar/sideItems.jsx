import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import styles from '../../styles/sidebar/sideItem.module.scss';

export default function SideItem({ text, link, Icon, SideState }) {
  return (
    <Link
      to={{
        pathname: link,
        tokenState: {
          tokenAddress: SideState,
          initialTxType: 'deposit',
        },
      }}
    >
      <div className={window.location.pathname !== link ? styles.itemInactive : styles.itemActive}>
        {/* <Icon size={24} /> */}
        <img src={window.location.pathname !== link ? Icon[1] : Icon[0]} />
        <div className={styles.itemText} id={text}>
          {text}
        </div>
      </div>
    </Link>
  );
}

SideItem.propTypes = {
  text: PropTypes.element.isRequired,
  link: PropTypes.element.isRequired,
  Icon: PropTypes.element.isRequired,
  SideState: PropTypes.element.optionalString,
};
