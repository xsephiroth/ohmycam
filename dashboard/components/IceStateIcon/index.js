import classNames from 'classnames/bind';
import styles from './IceStateIcon.module.scss';

const cx = classNames.bind(styles);

const IceStateIcon = ({
  className,
  waiting,
  checking,
  connected,
  disconnected
}) => (
  <i
    className={cx(
      {
        Icon: true,
        Waiting: waiting,
        Checking: checking,
        Connected: connected,
        Disconnected: disconnected
      },
      className
    )}
  />
);

export default IceStateIcon;
