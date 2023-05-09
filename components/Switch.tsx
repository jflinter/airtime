import { useState } from 'react';
import { Switch as HeadlessSwitch } from '@headlessui/react';
import classNames from 'classnames';

type Props = {
  label: string;
  defaultValue: boolean;
  onToggle: (enabled: boolean) => void;
}

export const Switch = ({label, onToggle, defaultValue}: Props) => {
  const [enabled, setEnabled] = useState(defaultValue);
  const handleToggle = (enabled: boolean) => {
    setEnabled(enabled);
    onToggle(enabled);
  };

  return (
    <HeadlessSwitch.Group
      as="div"
      className="flex items-center justify-between space-x-2"
    >
      <span className="flex flex-grow flex-col">
        <HeadlessSwitch.Label
          as="span"
          className="text-sm font-medium leading-6 text-gray-900"
          passive
        >
          {label}
        </HeadlessSwitch.Label>
      </span>
      <HeadlessSwitch
        checked={enabled}
        onChange={handleToggle}
        className={classNames(
          enabled ? 'bg-black' : 'bg-gray-200',
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2'
        )}
      >
        <span
          aria-hidden="true"
          className={classNames(
            enabled ? 'translate-x-5' : 'translate-x-0',
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
          )}
        />
      </HeadlessSwitch>
    </HeadlessSwitch.Group>
  );
}
