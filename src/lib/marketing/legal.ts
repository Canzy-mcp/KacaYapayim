import type { Metadata } from "next";
import { siteMetadata } from "./seo";
export const legalName=process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME?.trim();
export const supportEmail=process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
export const legalReady=Boolean(legalName&&supportEmail&&process.env.LEGAL_REVIEW_APPROVED==="true");
export function legalMetadata(title:string,path:string):Metadata{return {...siteMetadata(title,`${title} — KaçaYapayım kullanıcı bilgilendirmesi.`,path),...(!legalReady?{robots:{index:false,follow:false}}:{})};}
