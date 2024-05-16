import { ITableFilter } from '../../model';
import styles from './style.module.scss';

interface IProps {
  readonly filters: ReadonlyArray<ITableFilter>;
  readonly onChange: (values: { [key: string]: any }) => void;
}

export const SchemaFilter = (props: IProps) => {
  const { filters } = props;
  console.log(filters);

  return <div className={styles.schemeFilter}></div>;
};
