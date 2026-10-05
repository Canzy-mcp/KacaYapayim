import { PageHeader } from "@/components/layout";
import { WorkPanel } from "@/components/work/work-panel";
export const metadata={title:"İş Takibi"};
export default function WorkPage(){return <><PageHeader title="İş Takibi" description="Teklif takiplerini, keşif randevularını ve saha kayıtlarını birlikte gör."/><WorkPanel/></>;}
