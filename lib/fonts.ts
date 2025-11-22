import localFont from 'next/font/local';

export const samsungSharpSans = localFont({
  src: [
    {
      path: '../public/samsungsharpsans.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/samsungsharpsans-medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/samsungsharpsans-bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-samsung-sharp-sans',
  display: 'swap',
});

