require('dotenv').config();



async function generateWorkoutData(data) {
    try {
        const { userWeightAi, userHeightAi, userAgeAi, userExperienceAi, userInjuriesAi } = data;
        const folderId = process.env.YANDEX_FOLDER_ID;
        const apiKey = process.env.YANDEX_API_KEY;

      
        const url = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion";

  
        const body = {
            modelUri: `gpt://${folderId}/yandexgpt/latest`,
            completionOptions: {
                stream: false,
                temperature: 0.6,
                maxTokens: 2000 
            },
            messages: [
                {
                    role: "system",
                    text: `ты проф-тренер создай для меня тренировочный план на случайные 3 дня в неделе(от 5 упражнений в за тренировку) старайся использовать только 
                    базовые упражнения которые максимально эффективны для роста мышц.веса не указывай оставь 0кг в каждом упражнении.старайся подбирать
                     упражнения что бы не нагружать мою травму
                     В неделю до 5 упражнений на мышечную группу в каждом до 3 подхода
                    Пример: [{"id": "Mon_1", "exerciseName": "Жим", "weight": "60", "approaches": 3, "dayRussian": "Пн"}]`
                
                },
                {
                    role: "user",
                    text: `Атлет: ${userWeightAi}кг, ${userHeightAi}см, ${userAgeAi}лет, опыт ${userExperienceAi} мес. Травмы: ${userInjuriesAi || 'нет'}`
                }
            ]
        };

      
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Api-Key ${apiKey}`, 
                'x-folder-id': folderId
            },
            body: JSON.stringify(body)
        });

      
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Ошибка от Yandex API:", response.status, errorText);
            throw new Error(`Yandex API Error: ${response.status}`);
        }

     
        const responseData = await response.json();

        const content = responseData.result.alternatives[0].message.text;

    
        const cleanJson = content.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(cleanJson);

    } catch (error) {
        console.error("Детальная ошибка generateWorkoutData:", error);
        throw new Error("Не удалось сгенерировать план");
    }
}

module.exports = { generateWorkoutData };