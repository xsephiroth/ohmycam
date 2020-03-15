// import styled from 'styled-components'

// const Button = styled.button`
//     padding: 15px 20px;
// `;

import styles from './Button.module.scss';

const Button = ({ children, ...restProps }) => {
  return (
    <button {...restProps} className={styles.Button}>
      {children}
    </button>
  );
};

export default Button;
