import { useNavigate } from 'react-router-dom';
import IconButton from '../../components/buttons/icon-button';
import playIcon from '../../assets/svg/play.svg';
import shareIcon from '../../assets/svg/share.svg';
import wifiIcon from '../../assets/svg/wifi.svg';
import '../../css/landing-bg.css';
import CircularMenuButton from '../../components/buttons/circular-menu-button';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full w-full flex-col ">
      <div className="pt-20 text-center text-3xl">borjessons</div>
      <div className="ripple text-center text-6xl font-bold">Air Hockey</div>

      <div className="flex grow flex-col items-center justify-center gap-2 ">
        <IconButton text="Join Games" className="w-64" svgIcon={shareIcon} onClick={() => navigate('/games')} />
        <IconButton text="Create Game" className="w-64" svgIcon={playIcon} onClick={() => navigate('/games/new')} />
        <IconButton text="See who is online" className="w-64" svgIcon={wifiIcon} onClick={() => navigate('/games/online')} />
      </div>
      <br />
      <button className="fixed top-0 z-10" onClick={() => localStorage.removeItem('username')}>
        Clear localStorage
      </button>
    </div>
  );
}
