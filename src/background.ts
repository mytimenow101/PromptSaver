import {ensureSeedData} from "./lib/storage";
chrome.runtime.onInstalled.addListener(async()=>{await ensureSeedData();chrome.contextMenus.create({id:"save-selected-prompt",title:"Save selected text as prompt",contexts:["selection"]});});
chrome.contextMenus.onClicked.addListener(async(info,tab)=>{if(info.menuItemId==="save-selected-prompt"&&info.selectionText){await chrome.storage.local.set({draftSelection:info.selectionText});if(tab?.id&&chrome.sidePanel) await chrome.sidePanel.open({tabId:tab.id});}});
