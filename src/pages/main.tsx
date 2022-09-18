import type { NextPage } from 'next';

const Home: NextPage = () => {
  return (
    <div className="p-8">
      Okay, so, there&apos;s not much here yet, but hopefully there will be!
    </div>
  );
};

export default Object.assign(Home, { requiresLogin: true });
