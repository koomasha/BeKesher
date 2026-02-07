// ============================================
// BEKESHER - ПОДБОР ГРУПП v3.1
// ============================================
// ИЗМЕНЕНИЯ v3.1:
// - Занят = есть группа в статусе "Активна"
// - История повторов = только последние 4 недели
// ============================================

// НАСТРОЙКИ
const AIRTABLE_API_KEY = '...';
const AIRTABLE_BASE_ID = '...';

// Названия таблиц
const TABLES = {
  participants: 'Участники',
  groups: 'Группы'
};

// ФИЛЬТР УЧАСТНИКОВ
const PARTICIPANT_FILTER = {
  includeStatuses: ['Активен', 'Лид'],
  excludeOnPause: true
};

// ИСТОРИЯ ПОВТОРОВ - сколько недель проверять
const HISTORY_WEEKS = 4;

// КАРТА СОСЕДНИХ РЕГИОНОВ
const NEIGHBORING_REGIONS = {
  'Север': ['Центр'],
  'Центр': ['Север', 'Юг'],
  'Юг': ['Центр']
};

// ============================================
// ГЛАВНАЯ ФУНКЦИЯ - ПОДБОР ГРУПП
// ============================================

function createGroups() {
  console.log('🚀 Начинаем подбор групп v3.1...');

  // 1. Получаем активных участников
  var participants = getActiveParticipants();
  console.log('✅ Найдено участников: ' + participants.length);

  if (participants.length < 2) {
    console.log('❌ Недостаточно участников для подбора!');
    return { success: false, error: 'Недостаточно участников' };
  }

  // 2. Получаем участников с АКТИВНЫМИ группами (они заняты)
  var busyParticipants = getParticipantsInActiveGroups();
  console.log('✅ Уже в активных группах: ' + busyParticipants.size + ' человек');

  // 3. Фильтруем доступных участников
  var availableParticipants = participants.filter(function (p) {
    return !busyParticipants.has(p.id);
  });
  console.log('✅ Доступных для подбора: ' + availableParticipants.length);

  if (availableParticipants.length < 2) {
    console.log('⚠️ Недостаточно доступных участников!');
    return {
      success: true,
      groupsCreated: 0,
      unpaired: 0,
      message: 'Все участники уже в активных группах'
    };
  }

  // 4. Получаем историю групп за последние 4 недели (для проверки повторов)
  var groupHistory = getGroupHistoryLastWeeks(HISTORY_WEEKS);
  console.log('✅ История групп (последние ' + HISTORY_WEEKS + ' недель): ' + groupHistory.length + ' записей');

  var historyMap = buildHistoryMap(groupHistory);

  // МНОГОЭТАПНЫЙ ПОДБОР
  var allGroups = [];
  var unpaired = availableParticipants;

  // ЭТАП A: Строгий (регион + ±10 лет + не встречались за 4 недели)
  console.log('\n🎯 ЭТАП A: Строгий подбор (регион + ±10 лет + новые люди)');
  var resultA = matchGroupsStrict(unpaired, historyMap);
  allGroups = allGroups.concat(resultA.groups);
  unpaired = resultA.unpaired;
  console.log('✅ Этап A: ' + resultA.groups.length + ' групп, осталось ' + unpaired.length);

  // ЭТАП B: Расширяем возраст (регион + ±15 лет + не встречались)
  console.log('\n🎯 ЭТАП B: Расширенный возраст (±15 лет + новые люди)');
  var resultB = matchGroupsExpandedAge(unpaired, historyMap);
  allGroups = allGroups.concat(resultB.groups);
  unpaired = resultB.unpaired;
  console.log('✅ Этап B: ' + resultB.groups.length + ' групп, осталось ' + unpaired.length);

  // ЭТАП C: Разрешаем повторы (регион + ±15 лет + можно повторы)
  console.log('\n🎯 ЭТАП C: Разрешаем повторы');
  var resultC = matchGroupsAllowRepeats(unpaired, historyMap);
  allGroups = allGroups.concat(resultC.groups);
  unpaired = resultC.unpaired;
  console.log('✅ Этап C: ' + resultC.groups.length + ' групп, осталось ' + unpaired.length);

  // ЭТАП D: Соседние регионы
  console.log('\n🎯 ЭТАП D: Соседние регионы');
  var resultD = matchGroupsNeighboringRegions(unpaired, historyMap);
  allGroups = allGroups.concat(resultD.groups);
  unpaired = resultD.unpaired;
  console.log('✅ Этап D: ' + resultD.groups.length + ' групп, осталось ' + unpaired.length);

  // ЭТАП E: Форс-мажор (любые комбинации)
  console.log('\n🎯 ЭТАП E: Форс-мажор (никого не оставляем!)');
  var resultE = matchGroupsForceMajeure(unpaired);
  allGroups = allGroups.concat(resultE.groups);
  unpaired = resultE.unpaired;
  console.log('✅ Этап E: ' + resultE.groups.length + ' групп, осталось ' + unpaired.length);

  // Сохраняем группы
  var createdGroups = [];
  var today = new Date();
  for (var i = 0; i < allGroups.length; i++) {
    var created = createGroupRecord(allGroups[i], today);
    if (created) createdGroups.push(created);
  }

  console.log('\n🎉 ПОДБОР ГРУПП ЗАВЕРШЁН!');
  console.log('✅ Групп создано: ' + createdGroups.length);
  console.log('⚠️ Без группы: ' + unpaired.length);

  // Логируем оставшихся (если есть)
  for (var k = 0; k < unpaired.length; k++) {
    console.log('❌ БЕЗ ГРУППЫ: ' + unpaired[k].fields['Name'] + ' | ' + unpaired[k].fields['Регион']);
  }

  return {
    success: true,
    groupsCreated: createdGroups.length,
    unpaired: unpaired.length,
    unpairedNames: unpaired.map(function (p) { return p.fields['Name']; })
  };
}

// ============================================
// ПОЛУЧЕНИЕ ДАННЫХ ИЗ AIRTABLE
// ============================================

function getActiveParticipants() {
  var allRecords = [];
  var offset = null;

  do {
    var url = 'https://api.airtable.com/v0/' + AIRTABLE_BASE_ID + '/' + encodeURIComponent(TABLES.participants);
    if (offset) {
      url += '?offset=' + offset;
    }

    var response = callAirtable(url);

    if (response.records) {
      allRecords = allRecords.concat(response.records);
    }

    offset = response.offset || null;
  } while (offset);

  // Фильтруем
  var activeParticipants = [];

  for (var i = 0; i < allRecords.length; i++) {
    var record = allRecords[i];
    var status = record.fields['Статус'];
    var onPause = record.fields['На паузе'];

    // Проверка статуса
    if (!status) continue;
    if (PARTICIPANT_FILTER.includeStatuses.indexOf(status) === -1) continue;

    // Проверка паузы
    if (onPause && PARTICIPANT_FILTER.excludeOnPause) continue;

    activeParticipants.push(record);
  }

  console.log('📊 Активных участников: ' + activeParticipants.length);

  return activeParticipants;
}

// ============================================
// НОВОЕ: Получить участников в АКТИВНЫХ группах
// ============================================

function getParticipantsInActiveGroups() {
  var busy = new Set();
  var offset = null;

  // Фильтр: только группы со статусом "Активна"
  var formula = '{Статус} = "Активна"';

  do {
    var url = 'https://api.airtable.com/v0/' + AIRTABLE_BASE_ID + '/' + encodeURIComponent(TABLES.groups);
    url += '?filterByFormula=' + encodeURIComponent(formula);
    url += '&fields[]=Участник 1&fields[]=Участник 2&fields[]=Участник 3&fields[]=Участник 4';

    if (offset) {
      url += '&offset=' + offset;
    }

    var response = callAirtable(url);

    if (response.records) {
      for (var i = 0; i < response.records.length; i++) {
        var group = response.records[i];
        ['Участник 1', 'Участник 2', 'Участник 3', 'Участник 4'].forEach(function (field) {
          if (group.fields[field]) {
            group.fields[field].forEach(function (id) { busy.add(id); });
          }
        });
      }
    }

    offset = response.offset || null;
  } while (offset);

  return busy;
}

// ============================================
// НОВОЕ: История групп за последние N недель
// ============================================

function getGroupHistoryLastWeeks(weeks) {
  var allRecords = [];
  var offset = null;

  // Вычисляем дату N недель назад
  var cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - (weeks * 7));
  var cutoffStr = cutoffDate.toISOString().split('T')[0];

  // Фильтр: группы созданные после cutoffDate
  var formula = 'IS_AFTER({Дата создания}, "' + cutoffStr + '")';

  console.log('📅 История с: ' + cutoffStr);

  do {
    var url = 'https://api.airtable.com/v0/' + AIRTABLE_BASE_ID + '/' + encodeURIComponent(TABLES.groups);
    url += '?filterByFormula=' + encodeURIComponent(formula);
    url += '&fields[]=Участник 1&fields[]=Участник 2&fields[]=Участник 3&fields[]=Участник 4&fields[]=Дата создания';

    if (offset) {
      url += '&offset=' + offset;
    }

    var response = callAirtable(url);

    if (response.records) {
      allRecords = allRecords.concat(response.records);
    }

    offset = response.offset || null;
  } while (offset);

  return allRecords;
}

function buildHistoryMap(groupHistory) {
  var map = new Map();

  for (var i = 0; i < groupHistory.length; i++) {
    var group = groupHistory[i];
    var participants = [];

    ['Участник 1', 'Участник 2', 'Участник 3', 'Участник 4'].forEach(function (field) {
      if (group.fields[field] && group.fields[field][0]) {
        participants.push(group.fields[field][0]);
      }
    });

    // Каждый встречался с каждым в этой группе
    for (var j = 0; j < participants.length; j++) {
      for (var k = j + 1; k < participants.length; k++) {
        var a = participants[j];
        var b = participants[k];
        if (!map.has(a)) map.set(a, new Set());
        if (!map.has(b)) map.set(b, new Set());
        map.get(a).add(b);
        map.get(b).add(a);
      }
    }
  }

  return map;
}

// ============================================
// ЭТАП A: СТРОГИЙ ПОДБОР
// Регион + ±10 лет + не встречались
// ============================================

function matchGroupsStrict(participants, historyMap) {
  return matchGroupsWithCriteria(participants, historyMap, {
    sameRegion: true,
    ageRange: 10,
    allowRepeats: false
  });
}

// ============================================
// ЭТАП B: РАСШИРЕННЫЙ ВОЗРАСТ
// Регион + ±15 лет + не встречались
// ============================================

function matchGroupsExpandedAge(participants, historyMap) {
  return matchGroupsWithCriteria(participants, historyMap, {
    sameRegion: true,
    ageRange: 15,
    allowRepeats: false
  });
}

// ============================================
// ЭТАП C: РАЗРЕШАЕМ ПОВТОРЫ
// Регион + ±15 лет + можно повторы
// ============================================

function matchGroupsAllowRepeats(participants, historyMap) {
  return matchGroupsWithCriteria(participants, historyMap, {
    sameRegion: true,
    ageRange: 15,
    allowRepeats: true
  });
}

// ============================================
// ЭТАП D: СОСЕДНИЕ РЕГИОНЫ
// ============================================

function matchGroupsNeighboringRegions(participants, historyMap) {
  var groups = [];
  var matched = new Set();

  // Группируем по регионам
  var byRegion = {};
  for (var i = 0; i < participants.length; i++) {
    var p = participants[i];
    var region = p.fields['Регион'] || 'Неизвестно';
    if (!byRegion[region]) byRegion[region] = [];
    byRegion[region].push(p);
  }

  // Пробуем объединить соседние регионы
  var regionPairs = [
    ['Север', 'Центр'],
    ['Центр', 'Юг']
  ];

  for (var rp = 0; rp < regionPairs.length; rp++) {
    var region1 = regionPairs[rp][0];
    var region2 = regionPairs[rp][1];

    var combined = [];
    if (byRegion[region1]) {
      combined = combined.concat(byRegion[region1].filter(function (p) { return !matched.has(p.id); }));
    }
    if (byRegion[region2]) {
      combined = combined.concat(byRegion[region2].filter(function (p) { return !matched.has(p.id); }));
    }

    if (combined.length >= 2) {
      var result = matchGroupsWithCriteria(combined, historyMap, {
        sameRegion: false,
        ageRange: 15,
        allowRepeats: true
      });

      for (var g = 0; g < result.groups.length; g++) {
        groups.push(result.groups[g]);
        result.groups[g].participants.forEach(function (p) { matched.add(p.id); });
      }
    }
  }

  var unpaired = participants.filter(function (p) {
    return !matched.has(p.id);
  });

  return { groups: groups, unpaired: unpaired };
}

// ============================================
// ЭТАП E: ФОРС-МАЖОР
// Никого не оставляем! Но Север+Юг запрещено!
// ============================================

function matchGroupsForceMajeure(participants) {
  var groups = [];
  var matched = new Set();

  console.log('🚨 Форс-мажор: ' + participants.length + ' человек');

  // Группируем по совместимым регионам
  // Север может с Север, Центр
  // Центр может с Север, Центр, Юг
  // Юг может с Центр, Юг

  var byRegion = {
    'Север': [],
    'Центр': [],
    'Юг': []
  };

  for (var i = 0; i < participants.length; i++) {
    var p = participants[i];
    var region = p.fields['Регион'] || 'Центр';
    if (!byRegion[region]) byRegion[region] = [];
    byRegion[region].push(p);
  }

  // Сначала: Север + Центр
  var severCentr = byRegion['Север'].concat(byRegion['Центр']);
  var resultSC = formForceMajeureGroups(severCentr, matched);
  groups = groups.concat(resultSC);

  // Потом: Юг + оставшийся Центр
  var availableCentr = byRegion['Центр'].filter(function (p) { return !matched.has(p.id); });
  var yugCentr = byRegion['Юг'].concat(availableCentr);
  var resultYC = formForceMajeureGroups(yugCentr, matched);
  groups = groups.concat(resultYC);

  // Оставшиеся
  var unpaired = participants.filter(function (p) { return !matched.has(p.id); });

  // Если остался 1 человек — пытаемся добавить к существующей группе
  if (unpaired.length === 1 && groups.length > 0) {
    var loner = unpaired[0];
    var lonerRegion = loner.fields['Регион'] || 'Центр';

    // Ищем группу с совместимым регионом и размером < 4
    for (var g = 0; g < groups.length; g++) {
      if (groups[g].participants.length < 4) {
        var groupRegions = groups[g].participants.map(function (p) { return p.fields['Регион'] || 'Центр'; });
        var compatible = true;

        // Проверяем: Север и Юг не должны быть вместе
        if (lonerRegion === 'Север' && groupRegions.indexOf('Юг') !== -1) compatible = false;
        if (lonerRegion === 'Юг' && groupRegions.indexOf('Север') !== -1) compatible = false;

        if (compatible) {
          groups[g].participants.push(loner);
          console.log('🚨 Добавлен к группе: ' + loner.fields['Name']);
          unpaired = [];
          break;
        }
      }
    }
  }

  return { groups: groups, unpaired: unpaired };
}

function formForceMajeureGroups(participants, matched) {
  var groups = [];
  var remaining = participants.filter(function (p) { return !matched.has(p.id); });

  while (remaining.length >= 2) {
    var maxSize = Math.min(4, remaining.length);
    var groupSize = 2 + Math.floor(Math.random() * (maxSize - 1));

    if (remaining.length <= 4) {
      groupSize = remaining.length;
    }

    var groupParticipants = remaining.slice(0, groupSize);

    groups.push({
      participants: groupParticipants,
      isForceMajeure: true
    });

    groupParticipants.forEach(function (p) { matched.add(p.id); });

    console.log('🚨 Форс-мажор группа (' + groupSize + '): ' + groupParticipants.map(function (p) { return p.fields['Name']; }).join(' + '));

    remaining = remaining.slice(groupSize);
  }

  return groups;
}

// ============================================
// УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ПОДБОРА
// ============================================

function matchGroupsWithCriteria(participants, historyMap, criteria) {
  var groups = [];
  var matched = new Set();

  var pools = [];

  if (criteria.sameRegion) {
    var byRegion = {};
    for (var i = 0; i < participants.length; i++) {
      var p = participants[i];
      var region = p.fields['Регион'] || 'Неизвестно';
      if (!byRegion[region]) byRegion[region] = [];
      byRegion[region].push(p);
    }

    for (var region in byRegion) {
      pools.push({ region: region, participants: byRegion[region] });
    }
  } else {
    pools.push({ region: 'Все', participants: participants });
  }

  for (var poolIdx = 0; poolIdx < pools.length; poolIdx++) {
    var pool = pools[poolIdx].participants;
    var poolRegion = pools[poolIdx].region;

    pool.sort(function (a, b) {
      return (a.fields['Возраст'] || 0) - (b.fields['Возраст'] || 0);
    });

    var available = pool.filter(function (p) { return !matched.has(p.id); });

    while (available.length >= 2) {
      var maxPossible = Math.min(4, available.length);
      var groupSize = 2 + Math.floor(Math.random() * (maxPossible - 1));

      if (available.length <= 4) {
        groupSize = available.length;
      }

      var group = findCompatibleGroup(available, historyMap, criteria, groupSize);

      if (group) {
        groups.push({
          participants: group,
          region: poolRegion
        });

        group.forEach(function (p) { matched.add(p.id); });

        console.log('👥 Группа (' + group.length + ') в ' + poolRegion + ': ' + group.map(function (p) { return p.fields['Name']; }).join(' + '));

        available = available.filter(function (p) { return !matched.has(p.id); });
      } else {
        break;
      }
    }
  }

  var unpaired = participants.filter(function (p) {
    return !matched.has(p.id);
  });

  return { groups: groups, unpaired: unpaired };
}

function findCompatibleGroup(available, historyMap, criteria, targetSize) {
  for (var i = 0; i < available.length; i++) {
    var group = [available[i]];

    for (var j = 0; j < available.length && group.length < targetSize; j++) {
      if (i === j) continue;

      var candidate = available[j];
      var compatible = true;

      for (var k = 0; k < group.length; k++) {
        if (!checkCompatibility(group[k], candidate, historyMap, criteria)) {
          compatible = false;
          break;
        }
      }

      if (compatible) {
        group.push(candidate);
      }
    }

    if (group.length >= 2) {
      return group;
    }
  }

  return null;
}

function checkCompatibility(p1, p2, historyMap, criteria) {
  var age1 = p1.fields['Возраст'] || 30;
  var age2 = p2.fields['Возраст'] || 30;

  var ageDiff = Math.abs(age1 - age2);
  if (ageDiff > criteria.ageRange) {
    return false;
  }

  if (!criteria.allowRepeats) {
    var p1History = historyMap.get(p1.id);
    if (p1History && p1History.has(p2.id)) {
      return false;
    }
  }

  return true;
}

// ============================================
// СОЗДАНИЕ ЗАПИСЕЙ В AIRTABLE
// ============================================

function createGroupRecord(group, today) {
  var url = 'https://api.airtable.com/v0/' + AIRTABLE_BASE_ID + '/' + encodeURIComponent(TABLES.groups);

  var fields = {
    'Дата создания': today.toISOString().split('T')[0],
    'Статус': 'Активна'
  };

  for (var i = 0; i < group.participants.length; i++) {
    fields['Участник ' + (i + 1)] = [group.participants[i].id];
  }

  var data = { fields: fields };

  var options = {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + AIRTABLE_API_KEY,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(data)
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    return JSON.parse(response.getContentText());
  } catch (error) {
    console.log('❌ Ошибка создания группы: ' + error);
    return null;
  }
}

function callAirtable(url) {
  var options = {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + AIRTABLE_API_KEY
    }
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    return JSON.parse(response.getContentText());
  } catch (error) {
    console.log('❌ Ошибка Airtable API: ' + error);
    return { records: [] };
  }
}

// ============================================
// WEB APP
// ============================================

function doPost(e) {
  var result = createGroups();
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var result = createGroups();
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// ТЕСТ
// ============================================

function testCreateGroups() {
  var result = createGroups();
  console.log(JSON.stringify(result, null, 2));
}