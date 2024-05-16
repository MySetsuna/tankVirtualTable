import { SelectProps } from 'antd';
import { InputProps } from 'antd/lib';

type CompProps = SelectProps | InputProps;

export enum FilterType {
  Select,
  Input,
}

export interface ITableFilter {
  readonly type: FilterType;
  readonly props: CompProps;
}
