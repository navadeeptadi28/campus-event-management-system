import Navbar from './Navbar';
export default function Layout({children}){return <><Navbar/><main>{children}</main><footer><div>© {new Date().getFullYear()} CampusEvents · College Event Management System</div></footer></>}
