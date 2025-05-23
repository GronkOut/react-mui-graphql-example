import { useAuthentication } from '@/contexts/Authentication';
import './styles.scss';

export default function PagesErrorForbidden() {
  const { signOut } = useAuthentication();

  return (
    <div id="error">
      <div className="content">
        <img className="logo" src="/images/error/logo.svg" alt="Logo" />
        <h1 className="title">멤버 권한이 없습니다.</h1>
        <div className="description">권한을 부여받은 이후 재 로그인 부탁드립니다.</div>
        <button className="button" onClick={signOut}>
          로그아웃
        </button>
      </div>
    </div>
  );
}
