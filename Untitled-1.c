#include <stdio.h>
#include gcc -I c:\msys64\home\FreeRTOS\include your_source_file.c -o output.exe"freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include "driver/i2c.h"
#include "esp_log.h"

#define TAG "TEST"

// I2C config
#define I2C_MASTER_SCL_IO 9
#define I2C_MASTER_SDA_IO 8
#define I2C_MASTER_NUM I2C_NUM_0
#define I2C_MASTER_FREQ_HZ 100000

// MAX30102 default I2C address
#define MAX30102_ADDR 0x57

// RGB LED pins
#define LED_R 1
#define LED_G 2
#define LED_B 7

// Motor pin
#define MOTOR_PIN 10

// ---------------- I2C INIT ----------------
void i2c_master_init()
{
    i2c_config_t conf = {
        .mode = I2C_MODE_MASTER,
        .sda_io_num = I2C_MASTER_SDA_IO,
        .scl_io_num = I2C_MASTER_SCL_IO,
        .sda_pullup_en = GPIO_PULLUP_ENABLE,
        .scl_pullup_en = GPIO_PULLUP_ENABLE,
        .master.clk_speed = I2C_MASTER_FREQ_HZ
    };

    i2c_param_config(I2C_MASTER_NUM, &conf);
    i2c_driver_install(I2C_MASTER_NUM, conf.mode, 0, 0, 0);
}

// ---------------- I2C SCAN ----------------
void i2c_scan()
{
    ESP_LOGI(TAG, "Scanning I2C bus...");

    for (uint8_t addr = 1; addr < 127; addr++)
    {
        i2c_cmd_handle_t cmd = i2c_cmd_link_create();
        i2c_master_start(cmd);
        i2c_master_write_byte(cmd, (addr << 1) | I2C_MASTER_WRITE, true);
        i2c_master_stop(cmd);

        esp_err_t ret = i2c_master_cmd_begin(I2C_MASTER_NUM, cmd, 50 / portTICK_PERIOD_MS);
        i2c_cmd_link_delete(cmd);

        if (ret == ESP_OK)
        {
            ESP_LOGI(TAG, "Found device at 0x%02X", addr);
        }
    }
}

// ---------------- GPIO INIT ----------------
void gpio_init_all()
{
    gpio_reset_pin(LED_R);
    gpio_reset_pin(LED_G);
    gpio_reset_pin(LED_B);
    gpio_reset_pin(MOTOR_PIN);

    gpio_set_direction(LED_R, GPIO_MODE_OUTPUT);
    gpio_set_direction(LED_G, GPIO_MODE_OUTPUT);
    gpio_set_direction(LED_B, GPIO_MODE_OUTPUT);
    gpio_set_direction(MOTOR_PIN, GPIO_MODE_OUTPUT);
}

// ---------------- LED TEST ----------------
void led_test()
{
    ESP_LOGI(TAG, "Testing RGB LED...");

    // Red
    gpio_set_level(LED_R, 1);
    vTaskDelay(pdMS_TO_TICKS(1000));
    gpio_set_level(LED_R, 0);

    // Green
    gpio_set_level(LED_G, 1);
    vTaskDelay(pdMS_TO_TICKS(1000));
    gpio_set_level(LED_G, 0);

    // Blue
    gpio_set_level(LED_B, 1);
    vTaskDelay(pdMS_TO_TICKS(1000));
    gpio_set_level(LED_B, 0);
}

// ---------------- MOTOR TEST ----------------
void motor_test()
{
    ESP_LOGI(TAG, "Testing motor...");

    gpio_set_level(MOTOR_PIN, 1);
    vTaskDelay(pdMS_TO_TICKS(2000));

    gpio_set_level(MOTOR_PIN, 0);
    vTaskDelay(pdMS_TO_TICKS(2000));
}

// ---------------- MAIN ----------------
void app_main(void)
{
    ESP_LOGI(TAG, "Starting test...");

    i2c_master_init();
    gpio_init_all();

    while (1)
    {
        i2c_scan();   // Check sensor
        led_test();   // Blink RGB
        motor_test(); // Spin motor
    }
}