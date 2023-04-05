/**
 * makecode BME280 digital pressure and humidity sensor Package.
 * From microbit/micropython  community.
 * http://www.micropython.org.cn
 */

enum BME280_I2C_ADDRESS {
    //% block="0x76"
    ADDR_0x76 = 0x76,
    //% block="0x77"
    ADDR_0x77 = 0x77
}

enum BME280_T {
    //% block="C"
    T_C = 0,
    //% block="F"
    T_F = 1
}

enum BME280_P {
    //% block="Pa"
    Pa = 0,
    //% block="hPa"
    hPa = 1
}

/**
 * BME280 block
 */
//% weight=100 color=#70c0f0 icon="\uf042" block="BME280"
namespace BME280 {
    let BME280_I2C_ADDR = BME280_I2C_ADDRESS.ADDR_0x76

    function setreg(reg: number, dat: number): void {
        let buf = pins.createBuffer(2);
        buf[0] = reg;
        buf[1] = dat;
        pins.i2cWriteBuffer(BME280_I2C_ADDR, buf);
    }

    function getreg(reg: number): number {
        pins.i2cWriteNumber(BME280_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME280_I2C_ADDR, NumberFormat.UInt8BE);
    }

    function getInt8LE(reg: number): number {
        pins.i2cWriteNumber(BME280_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME280_I2C_ADDR, NumberFormat.Int8LE);
    }

    function getUInt16LE(reg: number): number {
        pins.i2cWriteNumber(BME280_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME280_I2C_ADDR, NumberFormat.UInt16LE);
    }

    function getInt16LE(reg: number): number {
        pins.i2cWriteNumber(BME280_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME280_I2C_ADDR, NumberFormat.Int16LE);
    }

    let dig_T1 = getUInt16LE(0x88)
    let dig_T2 = getInt16LE(0x8A)
    let dig_T3 = getInt16LE(0x8C)
    let dig_P1 = getUInt16LE(0x8E)
    let dig_P2 = getInt16LE(0x90)
    let dig_P3 = getInt16LE(0x92)
    let dig_P4 = getInt16LE(0x94)
    let dig_P5 = getInt16LE(0x96)
    let dig_P6 = getInt16LE(0x98)
    let dig_P7 = getInt16LE(0x9A)
    let dig_P8 = getInt16LE(0x9C)
    let dig_P9 = getInt16LE(0x9E)
    let dig_H1 = getreg(0xA1)
    let dig_H2 = getInt16LE(0xE1)
    let dig_H3 = getreg(0xE3)
    let a = getreg(0xE5)
    let dig_H4 = (getreg(0xE4) << 4) + (a % 16)
    let dig_H5 = (getreg(0xE6) << 4) + (a >> 4)
    let dig_H6 = getInt8LE(0xE7)
    setreg(0xF2, 0x04)
    setreg(0xF4, 0x2F)
    setreg(0xF5, 0x0C)
    let T = 0
    let P = 0
    let H = 0

    function get(): void {
        let adc_T = (getreg(0xFA) << 12) + (getreg(0xFB) << 4) + (getreg(0xFC) >> 4)
        let var1 = (((adc_T >> 3) - (dig_T1 << 1)) * dig_T2) >> 11
        let var2 = (((((adc_T >> 4) - dig_T1) * ((adc_T >> 4) - dig_T1)) >> 12) * dig_T3) >> 14
        let t = var1 + var2
        T = Math.idiv((t * 5 + 128) >> 8, 100)
        var1 = (t >> 1) - 64000
        var2 = (((var1 >> 2) * (var1 >> 2)) >> 11) * dig_P6
        var2 = var2 + ((var1 * dig_P5) << 1)
        var2 = (var2 >> 2) + (dig_P4 << 16)
        var1 = (((dig_P3 * ((var1 >> 2) * (var1 >> 2)) >> 13) >> 3) + (((dig_P2) * var1) >> 1)) >> 18
        var1 = ((32768 + var1) * dig_P1) >> 15
        if (var1 == 0)
            return; // avoid exception caused by division by zero
        let adc_P = (getreg(0xF7) << 12) + (getreg(0xF8) << 4) + (getreg(0xF9) >> 4)
        let _p = ((1048576 - adc_P) - (var2 >> 12)) * 3125
        _p = Math.idiv(_p, var1) * 2;
        var1 = (dig_P9 * (((_p >> 3) * (_p >> 3)) >> 13)) >> 12
        var2 = (((_p >> 2)) * dig_P8) >> 13
        P = _p + ((var1 + var2 + dig_P7) >> 4)
        let adc_H = (getreg(0xFD) << 8) + getreg(0xFE)
        var1 = t - 76800
        var2 = (((adc_H << 14) - (dig_H4 << 20) - (dig_H5 * var1)) + 16384) >> 15
        var1 = var2 * (((((((var1 * dig_H6) >> 10) * (((var1 * dig_H3) >> 11) + 32768)) >> 10) + 2097152) * dig_H2 + 8192) >> 14)
        var2 = var1 - (((((var1 >> 15) * (var1 >> 15)) >> 7) * dig_H1) >> 4)
        if (var2 < 0) var2 = 0
        if (var2 > 419430400) var2 = 419430400
        H = (var2 >> 12) >> 10
    }

    /**
     * get pressure
     */
    //% blockId="BME280_GET_PRESSURE" block="pressure %u"
    //% weight=80 blockGap=8
    export function pressure(u: BME280_P): number {
        get();
        if (u == BME280_P.Pa) return P;
        else return Math.idiv(P, 100)
    }

    /**
     * get temperature
     */
    //% blockId="BME280_GET_TEMPERATURE" block="temperature %u"
    //% weight=80 blockGap=8
    export function temperature(u: BME280_T): number {
        get();
        if (u == BME280_T.T_C) return T;
        else return 32 + Math.idiv(T * 9, 5)
    }

    /**
     * get humidity
     */
    //% blockId="BME280_GET_HUMIDITY" block="humidity"
    //% weight=80 blockGap=8
    export function humidity(): number {
        get();
        return H;
    }

    /**
     * power on
     */
    //% blockId="BME280_POWER_ON" block="Power On"
    //% weight=22 blockGap=8
    export function PowerOn() {
        setreg(0xF4, 0x2F)
    }

    /**
     * power off
     */
    //% blockId="BME280_POWER_OFF" block="Power Off"
    //% weight=21 blockGap=8
    export function PowerOff() {
        setreg(0xF4, 0)
    }

    /**
     * Calculate Dewpoint
     */
    //% block="Dewpoint"
    //% weight=60 blockGap=8
    export function Dewpoint(): number {
        get();
        return T - Math.idiv(100 - H, 5)
    }

    /**
     * Pressure below Event
     */
    //% block="Pressure below than %dat" dat.defl=100000
    export function PressureBelowThan(dat: number, body: () => void): void {
        control.inBackground(function () {
            while (true) {
                get()
                if (P < dat) {
                    body()
                }
                basic.pause(1000)
            }
        })
    }

    /**
     * Pressure higher Event
     */
    //% block="Pressure higher than %dat" dat.defl=100000
    export function PressureHigherThan(dat: number, body: () => void): void {
        control.inBackground(function () {
            while (true) {
                get()
                if (P > dat) {
                    body()
                }
                basic.pause(1000)
            }
        })
    }

    /**
     * humidity below Event
     */
    //% block="Humidity below than %dat" dat.defl=10
    export function HumidityBelowThan(dat: number, body: () => void): void {
        control.inBackground(function () {
            while (true) {
                get()
                if (H < dat) {
                    body()
                }
                basic.pause(1000)
            }
        })
    }

    /**
     * humidity higher Event
     */
    //% block="Humidity higher than %dat" dat.defl=50
    export function HumidityHigherThan(dat: number, body: () => void): void {
        control.inBackground(function () {
            while (true) {
                get()
                if (H > dat) {
                    body()
                }
                basic.pause(1000)
            }
        })
    }

    /**
     * temperature below Event
     */
    //% block="Temperature below than %dat" dat.defl=10
    export function TemperatureBelowThan(dat: number, body: () => void): void {
        control.inBackground(function () {
            while (true) {
                get()
                if (T < dat) {
                    body()
                }
                basic.pause(1000)
            }
        })
    }

    /**
     * temperature higher Event
     */
    //% block="Temperature higher than %dat" dat.defl=30
    export function TemperatureHigherThan(dat: number, body: () => void): void {
        control.inBackground(function () {
            while (true) {
                get()
                if (T > dat) {
                    body()
                }
                basic.pause(1000)
            }
        })
    }

    /**
     * set I2C address
     */
    //% blockId="BME280_SET_ADDRESS" block="set address %addr"
    //% weight=20 blockGap=8
    export function Address(addr: BME280_I2C_ADDRESS) {
        BME280_I2C_ADDR = addr
    }
}  