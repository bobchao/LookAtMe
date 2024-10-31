import { test, expect } from '@playwright/test';

test('basic visual elements', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/LookAtMe Timer/);

  // 檢查全螢幕鈕和設定鈕是否顯示
  await expect(page.locator('.fullscreen-icon')).toBeVisible();
  await expect(page.locator('.settings-icon')).toBeVisible();

  // 還不知道怎麼正確檢查 SVG 元素

  await page.locator('.settings-icon').click();
  await expect(page.locator('div').filter({ hasText: 'Bell sound by ConBlast,' }).first()).toBeVisible();
});

async function getIconClasses(page: any): Promise<string[]> { // 新增一個函式來獲取 icon 的 class
  const iconClasses: string[] = [];
  for (let i = 1; i <= 3; i++) { // 從 1 開始，因為 nth-child 是從 1 開始計算
    const className = await page.locator(`.icon-settings > .icon-setting:nth-child(${i}) .fas`).getAttribute('class').catch(() => null); // 捕捉錯誤
    const faClass = className ? className.match(/fa-\w+/) : null;
    if (faClass) {
      iconClasses.push(faClass[0]);
    }
  }
  return iconClasses; // 回傳獲取的 class 名稱
}

test('preserve settings', async ({ page }) => {
  await page.goto('/');

  //預設應該是全部 off
  //turn on everything and change settings
  await page.locator('.settings-icon > .fas').click();
  await page.locator('#circleColor').click();
  await page.locator('#circleColor').fill('#ff0000');
  await page.locator('#darkMode').click();
  await page.locator('#muteSound').click();
  
  await page.locator('#alwaysShowTime').click();
  const timeTextElement = page.getByText(':00:00');
  
  await page.locator('#showShortcuts').click();
  await expect(page.locator('.icon-settings')).toBeVisible();

  // My goal is to check if all the information is saved after changes,
  // so I should click through all the settings and intentionally change one value 
  //to see if they are saved correctly.
  
  const expectedClasses = ['fa-coffee', 'fa-mug', 'fa-briefcase'];
  await expect(await getIconClasses(page)).toEqual(expectedClasses);
  
  await page.getByRole('spinbutton').nth(0).press('ArrowUp'); //should be 4
  await page.getByRole('spinbutton').nth(1).press('ArrowDown'); //should be 16
  await page.getByRole('spinbutton').nth(2).press('ArrowDown'); //should be 26

  await page.locator('.icon-settings > .icon-setting:nth-child(1) .fas').click();
  await page.locator('.icon-categories > i:nth-child(4)').click();
  await page.locator('.icon-list > i:nth-child(4)').click(); //flag

  await page.locator('.icon-settings > .icon-setting:nth-child(2) .fas').click();
  await page.locator('.icon-categories > i:nth-child(2)').click();
  await page.locator('.icon-list > i:nth-child(5)').click(); //pizza

  await page.locator('.icon-settings > .icon-setting:nth-child(3) .fas').click();
  await page.locator('.icon-categories > i:nth-child(3)').click();
  await page.locator('.icon-list > i:nth-child(2)').click(); //laptop

  const expectedClassesAfterChange = await getIconClasses(page);
  const shortcutsValuesAfterChange: string[] = []; // 儲存修改後的值
  shortcutsValuesAfterChange[0] = await page.getByRole('spinbutton').nth(0).inputValue(); 
  shortcutsValuesAfterChange[1] = await page.getByRole('spinbutton').nth(1).inputValue(); 
  shortcutsValuesAfterChange[2] = await page.getByRole('spinbutton').nth(2).inputValue(); 

  await page.reload();
  await page.waitForTimeout(1000);
  await page.locator('.settings-icon > .fas').click();
  // 先確定全部都開了
  const circleColorValue = await page.locator('#circleColor').inputValue();
  const isMuteSoundActive = await page.locator('#muteSound').getAttribute('class').then(classes => classes?.includes('active') || false);
  const isAlwaysShowTimeActive = await page.locator('#alwaysShowTime').getAttribute('class').then(classes => classes?.includes('active') || false);
  const isShowShortcutsActive = await page.locator('#showShortcuts').getAttribute('class').then(classes => classes?.includes('active') || false);
  const isDarkModeActive = await page.locator('#darkMode').getAttribute('class').then(classes => classes?.includes('active') || false);
  
  expect(circleColorValue).toBe('#ff0000'); // 確認顏色值是否仍然是紅色
  expect(isMuteSoundActive).toBe(true);
  expect(isAlwaysShowTimeActive).toBe(true);
  expect(isShowShortcutsActive).toBe(true);
  expect(isDarkModeActive).toBe(true);

  const expectedClassesAfterReload = await getIconClasses(page);
  await expect(expectedClassesAfterReload).toEqual(expectedClassesAfterChange);

  const currentShortcutsValues: string[] = []; // 儲存現在的值
  currentShortcutsValues[0] = await page.getByRole('spinbutton').nth(0).inputValue(); 
  currentShortcutsValues[1] = await page.getByRole('spinbutton').nth(1).inputValue(); 
  currentShortcutsValues[2] = await page.getByRole('spinbutton').nth(2).inputValue(); 

  expect(currentShortcutsValues).toEqual(shortcutsValuesAfterChange);
});

test('check dark mode functionality', async ({ page }) => {
  await page.goto('/');
  
  await page.locator('.settings-icon > .fas').click();
  await page.locator('#alwaysShowTime').click();
  
  const timeTextElement = page.locator('div.timer-display');

  await expect(timeTextElement).toBeVisible();
  const timeTextColor_before = await timeTextElement.evaluate((el) => {
    return getComputedStyle(el).color;
  });
  expect(timeTextColor_before).toBe('rgb(0, 0, 0)');

  await page.locator('#darkMode').click();
  await page.waitForTimeout(1000);
  await expect(timeTextElement).toBeVisible();
  const timeTextColor_after = await timeTextElement.evaluate((el) => {
    return getComputedStyle(el).color;
  });
  expect(timeTextColor_after).toBe('rgb(255, 255, 255)');
});

//（隨時可以）拖曳以設定時間
//（隨時可以）點擊快捷圖示設定時間
//點擊快捷圖示可以正確設定所設定的時間
//快截圖示時間設定的驗證（限制為自然數、只能是 1-60、1 之前是 60、60 之後是 1）
//設定時間後開始倒數
//亮色顯示區隨時間變化
//時間到以後響鈴
//靜音模式下不響鈴
//超級全螢幕模式啟動與關閉
//（隨時可以）拖曳以設定時間
//設定時間後開始倒數
//亮色顯示區隨時間變化
//時間到以後響鈴
//靜音模式下不響鈴
//非全螢幕模式下，圓形總是至中並適應視窗大小
