import $ from "jquery";

import * as portico_modals from "../portico/portico_modals";

import * as helpers from "./helpers";

export function create_update_current_cycle_license_request(): void {
    $("#current-manual-license-count-update-button .billing-button-text").text("");
    $("#current-manual-license-count-update-button .loader").show();
    helpers.create_ajax_request("/json/billing/plan", "current-license-change", [], "PATCH", () => {
        window.location.replace("/billing/");
        $("#licensechange-success").show();
        $("#current-manual-license-count-update-button .loader").hide();
        $("#current-manual-license-count-update-button .billing-button-text").text("Update");
    }, () => {
        $("#current-manual-license-count-update-button .loader").hide();
        $("#current-manual-license-count-update-button .billing-button-text").text("Update");
    });
}

export function create_update_next_cycle_license_request(): void {
    $("#next-manual-license-count-update-button .loader").show();
    $("#next-manual-license-count-update-button .billing-button-text").text("");
    helpers.create_ajax_request("/json/billing/plan", "next-license-change", [], "PATCH", () => {
        window.location.replace("/billing/");
        $("#licensechange-success").show();
        $("#next-manual-license-count-update-button .loader").hide();
        $("#next-manual-license-count-update-button .billing-button-text").text("");
    }, () => {
        $("#next-manual-license-count-update-button .loader").hide();
        $("#next-manual-license-count-update-button .billing-button-text").text("");
    });
}

export function initialize(): void {
    helpers.set_tab("billing");

    $("#update-card-button").on("click", (e) => {
        helpers.create_ajax_request(
            "/json/billing/session/start_card_update_session",
            "cardchange",
            [],
            "POST",
            (response) => {
                const response_data = helpers.stripe_session_url_schema.parse(response);
                window.location.replace(response_data.stripe_session_url);
            },
        );
        e.preventDefault();
    });

    function get_old_and_new_license_count_for_current_cycle(): {
        new_current_manual_license_count: number;
        old_current_manual_license_count: number;
    } {
        const new_current_manual_license_count: number = Number.parseInt(
            $<HTMLInputElement>("#current-manual-license-count").val()!,
            10,
        );
        const old_current_manual_license_count: number = Number.parseInt(
            $<HTMLInputElement>("#current-manual-license-count").attr("data-original-value")!,
            10,
        );
        return {
            new_current_manual_license_count,
            old_current_manual_license_count,
        };
    }

    function get_old_and_new_license_count_for_next_cycle(): {
        new_next_manual_license_count: number;
        old_next_manual_license_count: number;
    } {
        const new_next_manual_license_count: number = Number.parseInt(
            $<HTMLInputElement>("#next-manual-license-count").val()!,
            10,
        );
        const old_next_manual_license_count: number = Number.parseInt(
            $<HTMLInputElement>("#next-manual-license-count").attr("data-original-value")!,
            10,
        );
        return {
            new_next_manual_license_count,
            old_next_manual_license_count,
        };
    }

    $("#current-license-change-form, #next-license-change-form").on("submit", (e) => {
        // We don't want user to accidentally update the license count on pressing enter.
        e.preventDefault();
        e.stopPropagation();
    });

    $("#current-manual-license-count-update-button").on("click", (e) => {
        if (!helpers.is_valid_input($("#current-license-change-form"))) {
            return;
        }
        e.preventDefault();
        const {new_current_manual_license_count, old_current_manual_license_count} =
            get_old_and_new_license_count_for_current_cycle();
        $("#new_license_count_holder").text(new_current_manual_license_count);
        $("#current_license_count_holder").text(old_current_manual_license_count);
        $("#confirm-licenses-modal .dialog_submit_button").attr("data-cycle", "current");
        portico_modals.open("confirm-licenses-modal");
    });

    $("#next-manual-license-count-update-button").on("click", (e) => {
        if (!helpers.is_valid_input($("#next-license-change-form"))) {
            return;
        }
        e.preventDefault();
        const {new_next_manual_license_count, old_next_manual_license_count} =
            get_old_and_new_license_count_for_next_cycle();
        $("#new_license_count_holder").text(new_next_manual_license_count);
        $("#current_license_count_holder").text(old_next_manual_license_count);
        $("#confirm-licenses-modal .dialog_submit_button").attr("data-cycle", "next");
        portico_modals.open("confirm-licenses-modal");
    });

    $("#confirm-licenses-modal .dialog_submit_button").on("click", () => {
        portico_modals.close("confirm-licenses-modal");
        if ($("#confirm-licenses-modal .dialog_submit_button").attr("data-cycle") === "current") {

            create_update_current_cycle_license_request();
        } else if (
            $("#confirm-licenses-modal .dialog_submit_button").attr("data-cycle") === "next"
        ) {
            create_update_next_cycle_license_request();
        }
    });

    $("#change-plan-status").on("click", (e) => {
        helpers.create_ajax_request("/json/billing/plan", "planchange", [], "PATCH", () =>
            window.location.replace("/billing/"),
        );
        e.preventDefault();
    });

    $("#cancel-subscription").on("click", (e) => {
        e.preventDefault();
        portico_modals.open("confirm-cancel-subscription-modal");
    });

    $("#current-manual-license-count").on("keyup", () => {
        const {new_current_manual_license_count, old_current_manual_license_count} =
            get_old_and_new_license_count_for_current_cycle();
        if (new_current_manual_license_count > old_current_manual_license_count) {
            $("#current-manual-license-count-update-button").prop("disabled", false);
            $("#current-license-change-error").text("");
        } else if (new_current_manual_license_count < old_current_manual_license_count) {
            $("#current-license-change-error").text(
                "You can only increase the number of licenses for the current billing period.",
            );
            $("#current-manual-license-count-update-button").prop("disabled", true);
        } else {
            $("#current-manual-license-count-update-button").prop("disabled", true);
            $("#current-license-change-error").text("");
        }
    });

    $("#next-manual-license-count").on("keyup", () => {
        const {new_next_manual_license_count, old_next_manual_license_count} =
            get_old_and_new_license_count_for_next_cycle();
        if (
            !new_next_manual_license_count ||
            new_next_manual_license_count === old_next_manual_license_count
        ) {
            $("#next-manual-license-count-update-button").prop("disabled", true);
        } else {
            $("#next-manual-license-count-update-button").prop("disabled", false);
        }
    });
}

$(() => {
    initialize();
});
