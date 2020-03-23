import styles from './Button.module.scss';

const Button = ({ children, ...restProps }) => {
  return (
    <button {...restProps} className={styles.Button}>
      {children}
    </button>
  );
};

export default Button;
