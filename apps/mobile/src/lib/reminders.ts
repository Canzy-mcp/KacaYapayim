import {Platform} from 'react-native';
import * as Notifications from 'expo-notifications';
Notifications.setNotificationHandler({handleNotification:async()=>({shouldPlaySound:false,shouldSetBadge:false,shouldShowBanner:true,shouldShowList:true})});
export async function setDeviceReminder(id:string,date:string){
 if(Platform.OS==='web')throw new Error('Cihaz hatırlatmaları iPhone veya Android uygulamasında kullanılabilir.');
 const when=new Date(date);if(!Number.isFinite(when.getTime())||when.getTime()<=Date.now())throw new Error('Gelecekteki bir tarih seç.');
 if(Platform.OS==='android')await Notifications.setNotificationChannelAsync('work',{name:'İş hatırlatmaları',importance:Notifications.AndroidImportance.DEFAULT});
 const permission=await Notifications.requestPermissionsAsync();if(permission.status!=='granted')throw new Error('Bildirim izni verilmedi. Kaydın uygulamada korunuyor.');
 await Notifications.cancelScheduledNotificationAsync('work-'+id);
 await Notifications.scheduleNotificationAsync({identifier:'work-'+id,content:{title:'KaçaYapayım hatırlatması',body:'Planladığın iş kaydını kontrol et.',data:{url:'/work'}},trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date:when,channelId:'work'}});
}
export async function cancelDeviceReminder(id:string){if(Platform.OS!=='web')await Notifications.cancelScheduledNotificationAsync('work-'+id);}
export async function clearDeviceReminders(){if(Platform.OS!=='web')await Notifications.cancelAllScheduledNotificationsAsync();}
