import Link from 'next/link';

type Props = {
  onBack: () => void;
};

export default function Info({ onBack }: Props) {
  return (
    <main className={`flex w-full flex-col items-center`}>
      <div className="sticky w-full top-0 z-50 bg-white shadow-bottom mb-4">
        <div className="w-full mx-auto pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link
                href={`#`}
                onClick={onBack}
                className="text-blue-600 flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="ml-0">Back</span>
              </Link>
            </div>
            <div className="text-center flex flex-col space-y-2">
              <h1 className={`text-xl font-semibold`}>hi phone</h1>
            </div>
            <div className="w-[60px]">&nbsp;</div>
          </div>
        </div>
      </div>
      <p className="px-4">
        Hey, I&apos;m Jack! Thanks for playing. If you like high phone or have
        any bugs or suggestions or just feel like saying hi, send me a text at{' '}
        <a className="text-blue-700" href="sms:+18476871127">
          8476871127
        </a>
        , I&apos;d love to hear from you!
      </p>
      <p className="px-4 pt-4">
        Unless you broke your phone and want to sue me, in which case: Hey, my
        name is Tom Murphy! I&apos;d love to field your complaint, please email
        me at{' '}
        <a className="text-blue-700" href="mailto:tommurphyemail@gmail.com">
          tommurphyemail@gmail.com
        </a>
        .
      </p>
    </main>
  );
}
