import { Navigate } from 'react-router';
import { useAuthentication } from '@/contexts/Authentication';
import './styles.scss';

export default function SignInPage() {
  const { session, signIn } = useAuthentication();

  if (session) return <Navigate to="/" replace />;

  return (
    <div id="intro">
      <div className="content">
        <img className="logo" src="/images/intro/logoVARCO.png" alt="VARCO logo" />
        <img className="text" src="/images/intro/textVARCOArtAdmin.png" alt="text VARCO Art Admin" />
        <p className="description">VARCO Art를 관리하는 어드민 공간입니다.</p>
        <button className="button" onClick={signIn}>
          시작하기
        </button>
      </div>
    </div>
  );
}
