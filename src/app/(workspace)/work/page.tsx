import { PageHeader } from "@/components/layout";
import { WorkPanel } from "@/components/work/work-panel";
import Link from "next/link";
export const metadata={title:"İş Takibi"};
export default function WorkPage(){return <><PageHeader title="İş Takibi" description="Teklif takiplerini, keşif randevularını ve saha kayıtlarını birlikte gör."/><Link href="/usta-talepleri?gorunum=isler" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary">Platformdan gelen işler ve randevular →</Link><WorkPanel/></>;}
