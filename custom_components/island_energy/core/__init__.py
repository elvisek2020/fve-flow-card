"""Pure-Python core of Hybrid Energy (no Home Assistant imports).

Forecast of battery state of charge, grid (AC IN) charge planning, HDO tariff
windows and cooling control. Everything here is deterministic and unit-tested;
the integration layer only feeds it data from Home Assistant and executes the
resulting decisions.
"""
